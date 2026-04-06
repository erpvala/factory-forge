// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DataFlowNode {
  id: string;
  type: 'project' | 'repository' | 'commit' | 'pipeline' | 'deployment' | 'log';
  data: any;
  timestamp: string;
  version: number;
  synced: boolean;
}

interface DataFlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'creates' | 'updates' | 'triggers' | 'logs' | 'deploys';
  data: any;
  timestamp: string;
}

interface SyncStatus {
  nodeId: string;
  status: 'syncing' | 'synced' | 'error';
  lastSync: string;
  error?: string;
}

const useDeveloperDataFlowSync = () => {
  const [nodes, setNodes] = useState<DataFlowNode[]>([]);
  const [edges, setEdges] = useState<DataFlowEdge[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [globalStore, setGlobalStore] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize data flow
  useEffect(() => {
    const initializeDataFlow = async () => {
      setLoading(true);

      // Mock initial data nodes
      const mockNodes: DataFlowNode[] = [
        {
          id: 'project_1',
          type: 'project',
          data: {
            name: 'E-commerce Platform',
            status: 'active',
            repositories: ['repo_1', 'repo_2']
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        },
        {
          id: 'repo_1',
          type: 'repository',
          data: {
            name: 'ecommerce-frontend',
            projectId: 'project_1',
            commits: ['commit_1', 'commit_2'],
            defaultBranch: 'main'
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        },
        {
          id: 'commit_1',
          type: 'commit',
          data: {
            hash: 'abc123',
            message: 'Fix checkout page',
            repositoryId: 'repo_1',
            author: 'John Developer'
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        },
        {
          id: 'pipeline_1',
          type: 'pipeline',
          data: {
            name: 'Build and Deploy',
            commitId: 'commit_1',
            status: 'success',
            stages: ['build', 'test', 'deploy']
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        },
        {
          id: 'deployment_1',
          type: 'deployment',
          data: {
            version: 'v2.3.1',
            pipelineId: 'pipeline_1',
            environment: 'production',
            status: 'deployed'
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        },
        {
          id: 'log_1',
          type: 'log',
          data: {
            level: 'info',
            message: 'Deployment completed successfully',
            deploymentId: 'deployment_1',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString(),
          version: 1,
          synced: true
        }
      ];

      // Mock data flow edges
      const mockEdges: DataFlowEdge[] = [
        {
          id: 'edge_1',
          source: 'project_1',
          target: 'repo_1',
          type: 'creates',
          data: { action: 'repository_creation' },
          timestamp: new Date().toISOString()
        },
        {
          id: 'edge_2',
          source: 'repo_1',
          target: 'commit_1',
          type: 'updates',
          data: { action: 'commit_push' },
          timestamp: new Date().toISOString()
        },
        {
          id: 'edge_3',
          source: 'commit_1',
          target: 'pipeline_1',
          type: 'triggers',
          data: { action: 'pipeline_trigger' },
          timestamp: new Date().toISOString()
        },
        {
          id: 'edge_4',
          source: 'pipeline_1',
          target: 'deployment_1',
          type: 'deploys',
          data: { action: 'deployment_execution' },
          timestamp: new Date().toISOString()
        },
        {
          id: 'edge_5',
          source: 'deployment_1',
          target: 'log_1',
          type: 'logs',
          data: { action: 'log_creation' },
          timestamp: new Date().toISOString()
        }
      ];

      setNodes(mockNodes);
      setEdges(mockEdges);

      // Initialize global store
      const store: Record<string, any> = {};
      mockNodes.forEach(node => {
        store[node.id] = { ...node.data, _meta: { timestamp: node.timestamp, version: node.version } };
      });
      setGlobalStore(store);

      // Initialize sync status
      const status: Record<string, SyncStatus> = {};
      mockNodes.forEach(node => {
        status[node.id] = {
          nodeId: node.id,
          status: 'synced',
          lastSync: node.timestamp
        };
      });
      setSyncStatus(status);

      setLoading(false);
    };

    initializeDataFlow();
  }, []);

  // Update node and propagate changes
  const updateNode = useCallback(async (nodeId: string, updates: any): Promise<void> => {
    console.log(`🔄 Updating node: ${nodeId}`);

    // Update node
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { ...node.data, ...updates },
            timestamp: new Date().toISOString(),
            version: node.version + 1,
            synced: false
          }
        : node
    ));

    // Update sync status
    setSyncStatus(prev => ({
      ...prev,
      [nodeId]: {
        nodeId,
        status: 'syncing',
        lastSync: new Date().toISOString()
      }
    }));

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update global store
    setGlobalStore(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updates,
        _meta: {
          timestamp: new Date().toISOString(),
          version: (prev[nodeId]?._meta?.version || 0) + 1
        }
      }
    }));

    // Mark as synced
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, synced: true } : node
    ));

    setSyncStatus(prev => ({
      ...prev,
      [nodeId]: {
        nodeId,
        status: 'synced',
        lastSync: new Date().toISOString()
      }
    }));

    // Propagate changes to connected nodes
    await propagateChanges(nodeId, updates);
  }, []);

  // Propagate changes through the data flow
  const propagateChanges = useCallback(async (sourceNodeId: string, changes: any): Promise<void> => {
    const outgoingEdges = edges.filter(edge => edge.source === sourceNodeId);
    
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find(node => node.id === edge.target);
      if (!targetNode) continue;

      console.log(`🔄 Propagating change: ${sourceNodeId} → ${edge.target} (${edge.type})`);

      // Simulate propagation delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update target node based on edge type
      let targetUpdates: any = {};
      
      switch (edge.type) {
        case 'creates':
          // Source creates target - update target's reference to source
          targetUpdates = { [`${sourceNodeId}Id`]: sourceNodeId };
          break;
        
        case 'updates':
          // Source updates target - reflect changes in target
          targetUpdates = { lastUpdateFrom: sourceNodeId, ...changes };
          break;
        
        case 'triggers':
          // Source triggers target - set target as active/pending
          targetUpdates = { status: 'triggered', triggeredBy: sourceNodeId };
          break;
        
        case 'deploys':
          // Source deploys target - mark deployment
          targetUpdates = { deploymentStatus: 'deployed', deployedFrom: sourceNodeId };
          break;
        
        case 'logs':
          // Source logs to target - create log entry
          targetUpdates = { 
            logEntry: {
              source: sourceNodeId,
              message: changes.message || 'Update occurred',
              timestamp: new Date().toISOString()
            }
          };
          break;
      }

      await updateNode(edge.target, targetUpdates);
    }
  }, [edges, nodes, updateNode]);

  // Complete data flow: Project → Repo → Commit → Pipeline → Deployment → Logs
  const executeCompleteFlow = useCallback(async (projectData: any): Promise<void> => {
    console.log('🚀 Executing complete data flow');

    try {
      // Step 1: Create Project
      const projectId = `project_${Date.now()}`;
      await updateNode(projectId, projectData);

      // Step 2: Create Repository
      const repoId = `repo_${Date.now()}`;
      await updateNode(repoId, {
        name: `${projectData.name}-repo`,
        projectId,
        defaultBranch: 'main'
      });

      // Step 3: Create Commit
      const commitId = `commit_${Date.now()}`;
      await updateNode(commitId, {
        hash: `abc${Date.now()}`,
        message: 'Initial commit',
        repositoryId: repoId,
        author: 'John Developer'
      });

      // Step 4: Trigger Pipeline
      const pipelineId = `pipeline_${Date.now()}`;
      await updateNode(pipelineId, {
        name: 'Build and Deploy',
        commitId,
        status: 'running',
        stages: ['build', 'test', 'deploy']
      });

      // Step 5: Create Deployment
      const deploymentId = `deployment_${Date.now()}`;
      await updateNode(deploymentId, {
        version: 'v1.0.0',
        pipelineId,
        environment: 'production',
        status: 'deploying'
      });

      // Step 6: Create Log
      const logId = `log_${Date.now()}`;
      await updateNode(logId, {
        level: 'info',
        message: 'Deployment flow completed',
        deploymentId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Complete data flow executed successfully');
    } catch (error) {
      console.error('❌ Data flow failed:', error);
    }
  }, [updateNode]);

  // Validate data consistency across all nodes
  const validateDataConsistency = useCallback((): {
    consistent: boolean;
    issues: string[];
    mismatches: Array<{ nodeId: string; field: string; expected: any; actual: any }>;
  } => {
    const issues: string[] = [];
    const mismatches: Array<{ nodeId: string; field: string; expected: any; actual: any }> = [];

    // Check if all nodes are synced
    const unsyncedNodes = nodes.filter(node => !node.synced);
    if (unsyncedNodes.length > 0) {
      issues.push(`${unsyncedNodes.length} nodes are not synced`);
    }

    // Check data consistency between global store and nodes
    nodes.forEach(node => {
      const storeData = globalStore[node.id];
      if (!storeData) {
        issues.push(`Node ${node.id} not found in global store`);
        return;
      }

      // Check version consistency
      if (storeData._meta?.version !== node.version) {
        mismatches.push({
          nodeId: node.id,
          field: 'version',
          expected: node.version,
          actual: storeData._meta?.version
        });
      }
    });

    // Check edge consistency
    edges.forEach(edge => {
      const sourceExists = nodes.some(node => node.id === edge.source);
      const targetExists = nodes.some(node => node.id === edge.target);
      
      if (!sourceExists) {
        issues.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
      }
      if (!targetExists) {
        issues.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
      }
    });

    const consistent = issues.length === 0 && mismatches.length === 0;
    console.log(consistent ? '✅ Data consistency validated' : '⚠️ Data consistency issues found');

    return { consistent, issues, mismatches };
  }, [nodes, edges, globalStore]);

  // Get sync status summary
  const getSyncStatusSummary = useCallback((): {
    total: number;
    synced: number;
    syncing: number;
    error: number;
  } => {
    const statuses = Object.values(syncStatus);
    return {
      total: statuses.length,
      synced: statuses.filter(s => s.status === 'synced').length,
      syncing: statuses.filter(s => s.status === 'syncing').length,
      error: statuses.filter(s => s.status === 'error').length
    };
  }, [syncStatus]);

  // Force sync all nodes
  const forceSyncAll = useCallback(async (): Promise<void> => {
    console.log('🔄 Force syncing all nodes');

    for (const node of nodes) {
      if (!node.synced) {
        await updateNode(node.id, {});
      }
    }

    console.log('✅ All nodes synced');
  }, [nodes, updateNode]);

  // Auto-sync on interval
  useEffect(() => {
    const autoSync = setInterval(() => {
      const unsyncedNodes = nodes.filter(node => !node.synced);
      if (unsyncedNodes.length > 0) {
        console.log(`🔄 Auto-syncing ${unsyncedNodes.length} nodes`);
        forceSyncAll();
      }
    }, 30000); // Auto-sync every 30 seconds

    return () => clearInterval(autoSync);
  }, [nodes, forceSyncAll]);

  return {
    nodes,
    edges,
    syncStatus,
    globalStore,
    loading,
    updateNode,
    executeCompleteFlow,
    validateDataConsistency,
    getSyncStatusSummary,
    forceSyncAll,
    propagateChanges
  };
};

export default useDeveloperDataFlowSync;
