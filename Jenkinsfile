pipeline {
    agent any

    environment {
        AWS_ACCESS_KEY_ID     = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        TF_VAR_key_name       = 'SMS-Production-Server'
        ENV_FILE              = credentials('sms-env-file')
        AWS_DEFAULT_REGION    = 'us-east-1'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/cchaitrasidamani-max/sms-edutrack.git',
                    credentialsId: 'github-credentials'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend_modified') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Terraform Init') {
            steps {
                dir('terraform') {
                    sh 'terraform init'
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                dir('terraform') {
                    sh 'terraform plan -out=tfplan'
                }
            }
        }

        stage('Terraform Apply') {
            steps {
                dir('terraform') {
                    sh 'terraform apply -auto-approve tfplan'
                }
            }
        }

        stage('Get Instance and Bucket Info') {
            steps {
                script {
                    env.INSTANCE_IP = sh(script: 'cd terraform && terraform output -raw instance_public_ip', returnStdout: true).trim()
                    env.INSTANCE_ID = sh(script: 'cd terraform && terraform output -raw instance_id', returnStdout: true).trim()
                    env.S3_BUCKET   = sh(script: 'cd terraform && terraform output -raw s3_bucket_name', returnStdout: true).trim()
                    echo "Instance IP: ${env.INSTANCE_IP}"
                    echo "Instance ID: ${env.INSTANCE_ID}"
                    echo "S3 Bucket:   ${env.S3_BUCKET}"
                }
            }
        }

        stage('Upload to S3') {
            steps {
                sh """
                    cp \${ENV_FILE} .env
                    aws s3 cp .env s3://${env.S3_BUCKET}/.env
                    aws s3 cp db/schema.sql s3://${env.S3_BUCKET}/schema.sql
                    aws s3 cp --recursive backend_modified s3://${env.S3_BUCKET}/backend_modified/
                    aws s3 cp --recursive frontend s3://${env.S3_BUCKET}/frontend/
                    aws s3 cp --recursive monitoring s3://${env.S3_BUCKET}/monitoring/
                """
            }
        }

        stage('Wait for Instance Ready') {
            steps {
                sh """
                    echo "Waiting for EC2 instance to finish setup..."
                    sleep 120
                    aws ssm wait command-executed \
                        --instance-id ${env.INSTANCE_ID} \
                        --command-id \$(aws ssm send-command \
                            --instance-ids ${env.INSTANCE_ID} \
                            --document-name "AWS-RunShellScript" \
                            --parameters commands="echo ready" \
                            --region us-east-1 \
                            --query "Command.CommandId" \
                            --output text) \
                        --region us-east-1 || true
                """
            }
        }

        stage('Deploy via SSM') {
            steps {
                sh """
                    aws ssm send-command \
                        --instance-ids ${env.INSTANCE_ID} \
                        --document-name "AWS-RunShellScript" \
                        --region us-east-1 \
                        --timeout-seconds 600 \
                        --parameters commands="
                            set -e
                            cd /home/ubuntu

                            echo '=== Downloading files from S3 ==='
                            aws s3 cp s3://${env.S3_BUCKET}/.env /home/ubuntu/.env
                            aws s3 cp s3://${env.S3_BUCKET}/schema.sql /home/ubuntu/schema.sql
                            aws s3 cp --recursive s3://${env.S3_BUCKET}/backend_modified /home/ubuntu/backend_modified
                            aws s3 cp --recursive s3://${env.S3_BUCKET}/frontend /home/ubuntu/frontend

                            echo '=== Loading environment variables ==='
                            export \\\$(cat /home/ubuntu/.env | grep -v '^#' | xargs)

                            echo '=== Setting up MySQL ==='
                            mysql -u root -e 'CREATE DATABASE IF NOT EXISTS smsdb;'
                            mysql -u root -e \\\"CREATE USER IF NOT EXISTS '\\\$DB_USERNAME'@'localhost' IDENTIFIED BY '\\\$DB_PASSWORD';\\\"
                            mysql -u root -e \\\"GRANT ALL PRIVILEGES ON smsdb.* TO '\\\$DB_USERNAME'@'localhost'; FLUSH PRIVILEGES;\\\"
                            mysql -u root smsdb < /home/ubuntu/schema.sql

                            echo '=== Starting Spring Boot Backend ==='
                            pkill -f 'student-management-system' || true
                            sleep 3
                            nohup java -jar /home/ubuntu/backend_modified/target/student-management-system-1.0.0.jar \
                                --spring.datasource.url=jdbc:mysql://localhost:3306/smsdb \
                                --spring.datasource.username=\\\$DB_USERNAME \
                                --spring.datasource.password=\\\$DB_PASSWORD \
                                --server.port=8080 \
                                > /var/log/backend.log 2>&1 &

                            echo '=== Setting up Nginx for Frontend ==='
                            cp -r /home/ubuntu/frontend/dist/* /var/www/html/
                            cat > /etc/nginx/sites-available/default << 'NGINXCONF'
server {
    listen 80;
    root /var/www/html;
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }
}
NGINXCONF
                            nginx -t && systemctl restart nginx

                            echo '=== Deployment complete! =='" \
                        --output text
                """
            }
        }

    }

    post {
        always {
            sh 'rm -f .env'
            cleanWs()
        }
        success {
            echo "✅ Deployment successful! App available at http://${env.INSTANCE_IP}"
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
    }
}