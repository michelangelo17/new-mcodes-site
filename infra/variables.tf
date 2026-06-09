variable "region" {
  type    = string
  default = "fr-par"
}

# --- Site (object storage + edge) ---------------------------------------------

variable "site_bucket_name" {
  type        = string
  default     = "mcodes-site"
  description = "Object Storage bucket holding the built static site."
}

variable "deploy_application_id" {
  type        = string
  description = "Scaleway IAM application ID of the deploy key's bearer. Granted full access in the bucket policy so applying it can't lock the pipeline out."
}

variable "site_domain" {
  type        = string
  default     = "michelangelo.codes"
  description = "Canonical site domain (apex)."
}

# --- MCP server (registry + container) ----------------------------------------

variable "registry_namespace" {
  type        = string
  default     = "mcodes"
  description = "Container Registry namespace for the MCP server image."
}

variable "container_image" {
  type        = string
  description = "Full image ref incl. tag, e.g. rg.fr-par.scw.cloud/mcodes/mcodes-mcp:<sha>. Set by CI."
}

variable "mcp_domain" {
  type        = string
  default     = "mcp.michelangelo.codes"
  description = "Custom domain for the MCP container."
}

variable "findings_enabled" {
  type        = bool
  default     = false
  description = "Gates the query_findings tool. Keep false until the dataset is real."
}

# --- AWS (Route 53 + ACM + CloudFront + OIDC) ---------------------------------

variable "route53_zone_id" {
  type        = string
  description = "Route 53 hosted zone ID for the domain."
}

variable "github_repo" {
  type        = string
  default     = "michelangelo17/new-mcodes-site"
  description = "GitHub <owner>/<repo> allowed to assume the deploy role via OIDC."
}
