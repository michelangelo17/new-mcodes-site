# Scaleway: everything except DNS. Reads SCW_* from the environment.
provider "scaleway" {
  region = var.region
  zone   = "${var.region}-1"
}

# AWS: Route 53 only. Creds passed explicitly (not env) so they don't collide
# with the AWS_* env the S3 state backend uses for Scaleway.
provider "aws" {
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
