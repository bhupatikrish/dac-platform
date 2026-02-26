# Setup & Installation

Here is how you can set up Global Identity Access for your application.

## Prerequisites
1. Valid Enterprise credentials.
2. Terraform installed locally.

## Steps
Run the following terraform module to provision your resources.
```hcl
module "provision_roles" {
  source = "terraform.enterprise.com/security/roles"
  version = "~> 1.0"
}
```