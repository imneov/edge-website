---
sidebar_position: 1
---

# Quick Start: Install Edge Node

This guide will help you set up your first edge node and connect it to the Edge Platform control plane.

## Prerequisites

Before you begin, ensure you have:

- ✅ A Kubernetes cluster (1.24+ recommended)
- ✅ kubectl configured and connected to your cluster
- ✅ Cluster admin permissions
- ✅ Network connectivity to the control plane
- ✅ At least 4GB RAM and 2 CPU cores available

## Step 1: Install Edge Platform Control Plane

If you haven't set up the control plane yet, follow these steps:

```bash
# Add Edge Platform Helm repository
helm repo add edge-platform https://charts.theriseunion.io
helm repo update

# Install control plane components
helm install edge-platform edge-platform/edge-platform \
  --namespace edge-system \
  --create-namespace \
  --set global.domain=your-domain.com
```

Wait for all pods to be running:

```bash
kubectl get pods -n edge-system
```

Expected output:
```
NAME                                READY   STATUS    RESTARTS   AGE
edge-apiserver-7d8f9c5b4d-abc12    1/1     Running   0          2m
edge-controller-6c7b8d9f5e-def34   1/1     Running   0          2m
edge-console-5a6b7c8d9e-ghi56      1/1     Running   0          2m
```

## Step 2: Get Control Plane Access

Retrieve the control plane endpoint:

```bash
export CONTROL_PLANE_ENDPOINT=$(kubectl get svc edge-apiserver \
  -n edge-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Control Plane: $CONTROL_PLANE_ENDPOINT"
```

Get the bootstrap token:

```bash
export BOOTSTRAP_TOKEN=$(kubectl get secret edge-bootstrap-token \
  -n edge-system \
  -o jsonpath='{.data.token}' | base64 -d)

echo "Bootstrap Token: $BOOTSTRAP_TOKEN"
```

## Step 3: Prepare Edge Cluster

On your edge Kubernetes cluster, create a namespace:

```bash
# Switch to edge cluster context
kubectl config use-context edge-cluster

# Create namespace
kubectl create namespace edge-system
```

## Step 4: Install Edge Agent

Create a configuration file for the edge agent:

```yaml title="edge-agent-config.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-agent-config
  namespace: edge-system
data:
  config.yaml: |
    controlPlane:
      endpoint: "https://${CONTROL_PLANE_ENDPOINT}:6443"
      token: "${BOOTSTRAP_TOKEN}"

    cluster:
      name: "edge-cluster-01"
      location: "datacenter-east"
      labels:
        env: "production"
        region: "us-east-1"

    agent:
      syncInterval: 30s
      heartbeatInterval: 10s
      logLevel: "info"
```

Apply the configuration:

```bash
# Substitute environment variables
envsubst < edge-agent-config.yaml | kubectl apply -f -
```

Install the edge agent:

```bash
kubectl apply -f https://raw.githubusercontent.com/theriseunion/edge-platform/main/deploy/edge-agent.yaml
```

## Step 5: Verify Installation

Check that the edge agent is running:

```bash
kubectl get pods -n edge-system
```

Expected output:
```
NAME                          READY   STATUS    RESTARTS   AGE
edge-agent-5b6c7d8e9f-xyz12   1/1     Running   0          1m
```

View agent logs:

```bash
kubectl logs -n edge-system -l app=edge-agent --tail=20
```

You should see logs indicating successful registration:
```
INFO  Successfully connected to control plane
INFO  Cluster registered: edge-cluster-01
INFO  Heartbeat sent, status: healthy
```

## Step 6: Verify from Control Plane

Switch back to the control plane cluster:

```bash
kubectl config use-context control-plane
```

List registered clusters:

```bash
kubectl get clusters -n edge-system
```

Expected output:
```
NAME              STATUS   AGE   REGION      NODES
edge-cluster-01   Ready    2m    us-east-1   3
```

Check cluster details:

```bash
kubectl describe cluster edge-cluster-01 -n edge-system
```

## Step 7: Access the Console

Open the Edge Platform console in your browser:

```bash
# Get the console URL
kubectl get ingress edge-console -n edge-system
```

Navigate to the URL and log in with default credentials:
- Username: `admin`
- Password: (retrieve from secret)

```bash
kubectl get secret edge-admin-password \
  -n edge-system \
  -o jsonpath='{.data.password}' | base64 -d
```

You should see your newly registered cluster in the dashboard!

## Troubleshooting

### Agent Cannot Connect to Control Plane

**Symptom**: Edge agent logs show connection errors

```bash
ERROR  Failed to connect to control plane: connection refused
```

**Solutions**:
1. Verify control plane endpoint is accessible:
   ```bash
   curl -k https://${CONTROL_PLANE_ENDPOINT}:6443/healthz
   ```

2. Check firewall rules allow traffic on port 6443

3. Verify bootstrap token is valid:
   ```bash
   kubectl get secret edge-bootstrap-token -n edge-system
   ```

### Cluster Shows as "NotReady"

**Symptom**: Cluster status is "NotReady" in console

**Solutions**:
1. Check agent heartbeat is working:
   ```bash
   kubectl logs -n edge-system -l app=edge-agent | grep heartbeat
   ```

2. Verify cluster resources are healthy:
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces
   ```

3. Check for network connectivity issues between edge and control plane

### Certificate Errors

**Symptom**: TLS/certificate validation errors

**Solutions**:
1. Ensure system clocks are synchronized (NTP)

2. Verify certificates are not expired:
   ```bash
   kubectl get secret -n edge-system edge-agent-cert -o yaml
   ```

3. If using self-signed certificates, ensure CA bundle is configured

## Next Steps

Congratulations! You've successfully set up your first edge node. Now you can:

1. [Deploy Your First Application](/docs/quick-start/deploy-app)
2. [Configure Access Control](/docs/quick-start/access-control)
3. [Set Up Monitoring](/docs/management/monitoring)
4. [Explore Advanced Features](/docs/management/advanced)

## Need Help?

- 📖 Read the [Installation Guide](/docs/installation) for production deployments
- 💬 Join our [Community Forum](https://community.theriseunion.io)
- 🐛 Report issues on [GitHub](https://github.com/imneov/edge-platform/issues)
