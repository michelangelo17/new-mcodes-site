terraform {
  required_version = ">= 1.7"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.40"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State in Scaleway Object Storage (S3-compatible). Bucket must exist before
  # `tofu init`. Backend reads AWS_ACCESS_KEY_ID/SECRET — set those to the
  # Scaleway keys (see SETUP.md).
  # State in Scaleway Object Storage (S3-compatible). Bucket must exist before
  # `tofu init`. Pass Scaleway creds at init via `-backend-config` flags (AWS_*
  # env in this project is reserved for real AWS — see SETUP.md).
  backend "s3" {
    bucket = "mcodes-tofu-state"
    key    = "infra.tfstate"
    region = "fr-par"

    endpoints = {
      s3 = "https://s3.fr-par.scw.cloud"
    }

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}
