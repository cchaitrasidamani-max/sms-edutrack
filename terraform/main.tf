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
  name_prefix = "sms-ssm-role-"   # ← unique name every time, no conflicts
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
  name_prefix = "sms-ssm-profile-"  # ← unique name every time, no conflicts
  role        = aws_iam_role.ssm_role.name
}

resource "aws_instance" "sms_instance" {
  ami                  = "ami-0c7217cdde317cfec"  # Ubuntu 22.04 LTS us-east-1
  instance_type        = var.instance_type
  key_name             = var.key_name
  security_groups      = [aws_security_group.sms_sg.name]
  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  user_data = <<-EOT
    #!/bin/bash
    set -e
    exec > /var/log/user-data.log 2>&1

    echo "=== Starting user-data script ==="

    # Update system
    apt-get update -y

    # Install dependencies
    apt-get install -y ca-certificates curl gnupg lsb-release unzip

    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Add ubuntu user to docker group
    usermod -aG docker ubuntu

    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install

    # SSM agent already installed via snap on Ubuntu 22.04 — just enable it
    systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
    systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

    echo "=== user-data script completed successfully ==="
  EOT

  tags = {
    Name = "SMS-Application1"
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