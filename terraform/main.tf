provider "aws" {
  region = var.region
}

variable "region" {
  default = "us-east-1"
}

variable "instance_type" {
  default = "m7i-flex.large"
}

variable "key_name" {
  description = "Name of the AWS key pair"
  type        = string
}

resource "aws_security_group" "sms_sg" {
  name_prefix = "sms-sg-"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8082
    to_port     = 8082
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "ssm_role" {
  name_prefix = "sms-ssm-role-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "s3_policy" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name_prefix = "sms-ssm-profile-"
  role        = aws_iam_role.ssm_role.name
}

resource "aws_instance" "sms_instance" {
  ami                  = "ami-0c7217cdde317cfec"
  instance_type        = var.instance_type
  key_name             = var.key_name
  security_groups      = [aws_security_group.sms_sg.name]
  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOT
    #!/bin/bash
    set -e
    exec > /var/log/user-data.log 2>&1

    echo "=== Starting EC2 setup ==="
    apt-get update -y
    apt-get install -y unzip curl

    echo "=== Installing Java 21 ==="
    apt-get install -y openjdk-21-jdk
    java -version

    echo "=== Installing MySQL ==="
    apt-get install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';"
    mysql -u root -e "FLUSH PRIVILEGES;"

    echo "=== Installing Nginx ==="
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx

    echo "=== Installing AWS CLI ==="
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install
    aws --version

    echo "=== Enabling SSM Agent ==="
    systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
    systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

    echo "=== EC2 setup complete ==="
  EOT

  tags = {
    Name = "SMS-Application"
  }
}

resource "aws_s3_bucket" "sms_deployment_bucket" {
  bucket = "sms-deployment-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

output "s3_bucket_name" {
  value = aws_s3_bucket.sms_deployment_bucket.bucket
}

output "instance_id" {
  value = aws_instance.sms_instance.id
}

output "instance_public_ip" {
  value = aws_instance.sms_instance.public_ip
}