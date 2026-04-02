/**
 * Centralized action button styles.
 * Spread onto HeroUI <Button> components:
 *   <Button {...ACTION_BUTTON.approve} onPress={...}>APPROVE</Button>
 *
 * Add new actions here — never hardcode variant/className in individual views.
 */

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger';

type ActionButtonConfig = {
  size?: 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  className?: string;
};

export const ACTION_BUTTON = {
  /** Primary — confirm / approve / complete */
  approve: {
    size: 'sm',
    variant: 'primary',
  },

  /** Red ghost — deny / reject */
  reject: {
    size: 'sm',
    variant: 'ghost',
    className: 'text-danger hover:bg-danger/10',
  },

  /** Red solid — destructive confirm (modal submit) */
  rejectSolid: {
    size: 'sm',
    variant: 'danger',
  },

  /** Red ghost — permanent delete */
  delete: {
    size: 'sm',
    variant: 'ghost',
    className: 'text-danger hover:bg-danger/10',
  },

  /** Neutral — open editor */
  edit: {
    size: 'sm',
    variant: 'secondary',
  },

  /** Primary — save / create */
  save: {
    size: 'sm',
    variant: 'primary',
  },

  /** Subtle — cancel / close */
  cancel: {
    size: 'sm',
    variant: 'tertiary',
  },

  /** Subtle — view / open */
  view: {
    size: 'sm',
    variant: 'tertiary',
  },
} as const satisfies Record<string, ActionButtonConfig>;
