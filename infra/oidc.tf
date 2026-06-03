# GitHub Actions OIDC trust for the deploy workflow. First apply must be local
# (needs IAM write); CI uses the role thereafter.

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # Required field; AWS no longer validates it for GitHub OIDC.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Any ref in the repo. Narrow to `:ref:refs/heads/main` to restrict to main.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "mcodes-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

# Deploy permissions only: Route 53, ACM, CloudFront. No IAM write.
resource "aws_iam_role_policy_attachment" "route53" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRoute53FullAccess"
}

resource "aws_iam_role_policy_attachment" "acm" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCertificateManagerFullAccess"
}

resource "aws_iam_role_policy_attachment" "cloudfront" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"
}

# Read-only IAM so CI can refresh the resources in this file, not mutate them.
resource "aws_iam_role_policy" "iam_read" {
  name = "iam-read"
  role = aws_iam_role.github_deploy.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:GetOpenIDConnectProvider",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:ListOpenIDConnectProviders",
      ]
      Resource = "*"
    }]
  })
}
