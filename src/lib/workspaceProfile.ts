/**
 * Workspace Profile — persists common business context to localStorage so
 * users don't re-type the same boilerplate on every tool run.
 *
 * Saved fields:
 *   business_name, description, target_market, revenue_model, stage
 *
 * These map to the most common field keys across tool forms.
 */

const STORAGE_KEY = "nova-workspace-profile";

export interface WorkspaceProfile {
  business_name?: string;
  description?: string;
  target_market?: string;
  revenue_model?: string;
  stage?: string;
}

export function loadWorkspaceProfile(): WorkspaceProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as WorkspaceProfile;
  } catch {
    return {};
  }
}

export function saveWorkspaceProfile(profile: WorkspaceProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

/**
 * Given a record of form fields, extract any profile-worthy values and
 * merge them into the persisted profile.
 *
 * Call this after a successful tool run so the profile self-populates
 * without the user having to explicitly fill anything out.
 */
export function extractAndSaveProfileFromFields(fields: Record<string, string>): void {
  const existing = loadWorkspaceProfile();
  const updated: WorkspaceProfile = { ...existing };

  // Business name — grab from the most common keys
  if (fields.startupName && fields.startupName.trim())
    updated.business_name = fields.startupName.trim();
  else if (fields.business_name && fields.business_name.trim())
    updated.business_name = fields.business_name.trim();
  else if (fields.company_name && fields.company_name.trim())
    updated.business_name = fields.company_name.trim();

  // Description
  if (fields.idea && fields.idea.trim().length > 20)
    updated.description = fields.idea.trim();
  else if (fields.product && fields.product.trim().length > 20)
    updated.description = fields.product.trim();
  else if (fields.business_description && fields.business_description.trim().length > 20)
    updated.description = fields.business_description.trim();
  else if (fields.description && fields.description.trim().length > 20)
    updated.description = fields.description.trim();

  // Target market
  if (fields.targetMarket && fields.targetMarket.trim())
    updated.target_market = fields.targetMarket.trim();
  else if (fields.targetCustomer && fields.targetCustomer.trim())
    updated.target_market = fields.targetCustomer.trim();
  else if (fields.target_customer && fields.target_customer.trim())
    updated.target_market = fields.target_customer.trim();
  else if (fields.target_market && fields.target_market.trim())
    updated.target_market = fields.target_market.trim();

  // Revenue model
  if (fields.revenueModel && fields.revenueModel.trim())
    updated.revenue_model = fields.revenueModel.trim();
  else if (fields.revenue_model && fields.revenue_model.trim())
    updated.revenue_model = fields.revenue_model.trim();

  // Stage
  if (fields.stage && fields.stage.trim())
    updated.stage = fields.stage.trim();

  saveWorkspaceProfile(updated);
}

/**
 * Returns pre-fill values for the given tool's field keys based on
 * the persisted workspace profile.
 */
export function getProfilePrefills(
  toolFieldKeys: string[],
  profile: WorkspaceProfile,
): Record<string, string> {
  const fills: Record<string, string> = {};
  if (!profile) return fills;

  for (const key of toolFieldKeys) {
    switch (key) {
      case "startupName":
      case "business_name":
      case "company_name":
        if (profile.business_name) fills[key] = profile.business_name;
        break;
      case "idea":
      case "product":
      case "business_description":
      case "description":
        if (profile.description) fills[key] = profile.description;
        break;
      case "targetMarket":
      case "targetCustomer":
      case "target_customer":
      case "target_market":
        if (profile.target_market) fills[key] = profile.target_market;
        break;
      case "revenueModel":
      case "revenue_model":
        if (profile.revenue_model) fills[key] = profile.revenue_model;
        break;
      case "stage":
        if (profile.stage) fills[key] = profile.stage;
        break;
    }
  }
  return fills;
}
