-- playbooks: one per user, stores the AI-generated business playbook
CREATE TABLE IF NOT EXISTS playbooks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content         jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playbooks" ON playbooks
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- playbook_progress: checkbox state per task, persisted on every change
CREATE TABLE IF NOT EXISTS playbook_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playbook_id uuid NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  task_id     text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

ALTER TABLE playbook_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playbook progress" ON playbook_progress
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
