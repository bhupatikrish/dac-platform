# Setup & Installation

Here is how you can set up Elastic Compute provisioning for your application.

## Prerequisites
1. Valid Enterprise credentials.
2. Terraform installed locally.

## Steps
Run the following terraform module to provision your resources.
```hcl
module "provision_eks" {
  source = "terraform.enterprise.com/infrastructure/eks"
  version = "~> 1.0"
}
```