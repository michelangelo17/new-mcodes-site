# Reads SCW_* from env.
provider "scaleway" {
  region = var.region
  zone   = "${var.region}-1"
}

# Credentials from the default SDK chain (OIDC in CI, SSO locally).
# us-east-1: required for CloudFront ACM certs.
provider "aws" {
  region = "us-east-1"
}
