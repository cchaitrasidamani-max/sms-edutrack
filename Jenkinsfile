pipeline {
    agent any

    environment {
        AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        TF_VAR_key_name = 'your-key-pair-name'  // Replace with your key pair name
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-repo/sms-edutrack.git'  // Replace with your repo
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
                    env.INSTANCE_IP = sh(script: 'cd terraform && terraform output instance_public_ip', returnStdout: true).trim()
                    env.INSTANCE_ID = sh(script: 'cd terraform && terraform output instance_id', returnStdout: true).trim()
                    env.S3_BUCKET = sh(script: 'cd terraform && terraform output s3_bucket_name', returnStdout: true).trim()
                }
            }
        }

        stage('Upload to S3') {
            steps {
                sh "aws s3 cp docker-compose.yml s3://${env.S3_BUCKET}/"
                sh "aws s3 cp --recursive backend_modified s3://${env.S3_BUCKET}/backend_modified/"
                sh "aws s3 cp --recursive frontend s3://${env.S3_BUCKET}/frontend/"
                sh "aws s3 cp --recursive monitoring s3://${env.S3_BUCKET}/monitoring/"
                sh "aws s3 cp db/schema.sql s3://${env.S3_BUCKET}/schema.sql"
            }
        }

        stage('Deploy via SSM') {
            steps {
                sh """
                aws ssm send-command --instance-ids ${env.INSTANCE_ID} --document-name "AWS-RunShellScript" --parameters commands="aws s3 cp s3://${env.S3_BUCKET}/docker-compose.yml . && aws s3 cp s3://${env.S3_BUCKET}/schema.sql . && aws s3 cp --recursive s3://${env.S3_BUCKET}/backend_modified . && aws s3 cp --recursive s3://${env.S3_BUCKET}/frontend . && aws s3 cp --recursive s3://${env.S3_BUCKET}/monitoring . && docker compose up -d"
                """
            }
        }
    }

}