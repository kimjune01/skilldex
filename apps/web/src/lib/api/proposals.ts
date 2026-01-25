/**
 * Skill Proposals API module - DEPRECATED
 *
 * Use skills.create() instead for direct skill creation.
 * Keeping for backward compatibility with any legacy code.
 */

import type {
  SkillProposalPublic,
  SkillProposalCreateRequest,
  SkillProposalReviewRequest,
} from '@skillomatic/shared';

/** @deprecated Use skills.create() for direct skill creation */
export const proposals = {
  /** @deprecated Proposals are no longer used */
  list: (_status?: string) => Promise.resolve([] as SkillProposalPublic[]),

  /** @deprecated Proposals are no longer used */
  get: (_id: string) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.create() instead.')),

  /** @deprecated Use skills.create() instead */
  create: (_body: SkillProposalCreateRequest) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.create() instead.')),

  /** @deprecated Proposals are no longer used */
  update: (_id: string, _body: SkillProposalCreateRequest) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.update() instead.')),

  /** @deprecated Proposals are no longer used */
  delete: (_id: string) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.delete() instead.')),

  /** @deprecated Visibility requests are handled through skills.requestVisibility() */
  review: (_id: string, _body: SkillProposalReviewRequest) =>
    Promise.reject(
      new Error(
        'Proposals are deprecated. Use skills.approveVisibility() or skills.denyVisibility() instead.'
      )
    ),
};
