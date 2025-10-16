export interface TriggerType {
  name: string;
  slug: string;
  description: string;
  toolkit: string;
  schema?: Record<string, any>;
  payload?: Record<string, any>;
  config?: Record<string, any>;
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  user_id: string;
  composio_trigger_id?: string;
  toolkit_slug: string;
  trigger_name: string;
  trigger_config: Record<string, any>;
  connected_account_id: string;
  active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowTriggerRequest {
  toolkit_slug: string;
  trigger_name: string;
  trigger_config?: Record<string, any>;
  connected_account_id: string;
  metadata?: Record<string, any>;
}

export interface TriggerSelectorProps {
  onTriggerAdd: (trigger: Omit<WorkflowTrigger, 'id' | 'workflow_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  existingTriggers: Array<Omit<WorkflowTrigger, 'id' | 'workflow_id' | 'user_id' | 'created_at' | 'updated_at'>>;
  disabled?: boolean;
}

export interface TriggerListProps {
  triggers: WorkflowTrigger[];
  onDelete: (triggerId: string) => void;
  loading?: boolean;
}

export interface TriggerConfigFormProps {
  triggerType: TriggerType;
  onSubmit: (config: Record<string, any>) => void;
  onCancel: () => void;
  initialConfig?: Record<string, any>;
}

export interface AvailableTriggersResponse {
  triggers: TriggerType[];
  connectedAccounts: Array<{
    id: string;
    toolkit: string;
    status: string;
  }>;
}

