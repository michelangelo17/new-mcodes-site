# Registry namespace + the MCP Serverless Container. The image must exist
# before the container references it, so CI applies the registry namespace
# first, pushes, then applies the rest (see SETUP.md).

resource "scaleway_registry_namespace" "mcp" {
  name      = var.registry_namespace
  region    = var.region
  is_public = false
}

resource "scaleway_container_namespace" "mcp" {
  name   = "mcodes"
  region = var.region
}

resource "scaleway_container" "mcp" {
  name         = "mcodes-mcp"
  namespace_id = scaleway_container_namespace.mcp.id

  image     = var.container_image
  port      = 8080
  min_scale = 0
  max_scale = 2
  # Bytes / mvCPU. Must be a valid Scaleway tier pairing.
  memory_limit_bytes = 536870912 # 512 MiB
  cpu_limit          = 280

  environment_variables = {
    FINDINGS_ENABLED = tostring(var.findings_enabled)
  }

  liveness_probe {
    failure_threshold = 3
    interval          = "10s"
    timeout           = "10s"
    http {
      path = "/healthz"
    }
  }
}

# Managed cert issues once the CNAME (dns.tf) resolves to the container.
resource "scaleway_container_domain" "mcp" {
  container_id = scaleway_container.mcp.id
  hostname     = var.mcp_domain

  depends_on = [aws_route53_record.mcp]
}
