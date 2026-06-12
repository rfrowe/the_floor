/**
 * Studio — the LLM Studio wizard shell.
 *
 * Hosts the step-based "create a category" flow: a header, the
 * {@link StudioStepper} progress indicator, the active step's content
 * (placeholders until each step's dedicated task lands), Back/Continue
 * controls gated by `canAdvance`, and a Resume / Start over prompt when a
 * persisted draft is found on load.
 *
 * No OpenAI calls happen here (Task 53 scope); steps render placeholders.
 */

import { Container } from '@components/common/Container';
import { Button } from '@components/common/Button';
import { LinkButton } from '@components/common/LinkButton';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { StudioStepper } from '@components/studio/StudioStepper';
import { CredentialsStep } from '@components/studio/steps/CredentialsStep';
import { STUDIO_STEPS, useStudioState } from '@hooks/useStudioState';
import type { StudioStep } from '@types';
import styles from './Studio.module.css';

/** Short title shown above each step's placeholder content. */
const STEP_TITLES: Record<StudioStep, string> = {
  credentials: 'Enter your OpenAI credentials',
  categoryName: 'Pick a category name',
  cards: 'Generate card ideas',
  images: 'Generate images',
  censor: 'Censor the giveaway text',
  save: 'Save your category',
};

/** Placeholder copy describing what each step will do once implemented. */
const STEP_PLACEHOLDERS: Record<StudioStep, string> = {
  credentials: '',
  categoryName: 'AI-suggested names with reroll arrive in Task 56.',
  cards: 'Editable AI-generated card ideas arrive in Task 57.',
  images: 'Per-card image generation arrives in Task 58.',
  censor: 'The interactive censor-box editor arrives in Task 59.',
  save: 'Saving to the library and JSON export arrive in Task 60.',
};

function Studio() {
  const { draft, canAdvance, actions, isHydrating, pendingDraft, resumeDraft, discardDraft } =
    useStudioState();

  const currentIndex = STUDIO_STEPS.indexOf(draft.step);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex >= STUDIO_STEPS.length - 1;

  const goBack = () => {
    const prev = STUDIO_STEPS[currentIndex - 1];
    if (prev) {
      actions.setStep(prev);
    }
  };

  const goNext = () => {
    const next = STUDIO_STEPS[currentIndex + 1];
    if (next && canAdvance) {
      actions.setStep(next);
    }
  };

  const handleStepSelect = (step: StudioStep) => {
    const targetIndex = STUDIO_STEPS.indexOf(step);
    // Back navigation is always allowed; forward only one step and only when
    // the current step's guard passes.
    if (targetIndex <= currentIndex || (targetIndex === currentIndex + 1 && canAdvance)) {
      actions.setStep(step);
    }
  };

  const studioClass = styles['studio'] ?? '';
  const headerClass = styles['header'] ?? '';
  const titleClass = styles['title'] ?? '';
  const headerActionsClass = styles['header-actions'] ?? '';
  const stepperPanelClass = styles['stepper-panel'] ?? '';
  const stepPanelClass = styles['step-panel'] ?? '';
  const placeholderClass = styles['placeholder'] ?? '';
  const controlsClass = styles['controls'] ?? '';
  const resumeOverlayClass = styles['resume-overlay'] ?? '';
  const resumeCardClass = styles['resume-card'] ?? '';
  const resumeActionsClass = styles['resume-actions'] ?? '';

  return (
    <Container className={studioClass}>
      <header className={headerClass}>
        <h1 className={titleClass}>The Floor — Studio</h1>
        <div className={headerActionsClass}>
          <ThemeToggle />
          <LinkButton to="/" variant="secondary">
            Back to Dashboard
          </LinkButton>
        </div>
      </header>

      <div className={stepperPanelClass}>
        <StudioStepper
          currentStep={draft.step}
          canAdvance={canAdvance}
          onStepSelect={handleStepSelect}
        />
      </div>

      <section className={stepPanelClass} aria-live="polite">
        <h2>{STEP_TITLES[draft.step]}</h2>
        {draft.step === 'credentials' ? (
          <CredentialsStep onContinue={goNext} />
        ) : (
          <p className={placeholderClass}>{STEP_PLACEHOLDERS[draft.step]}</p>
        )}
      </section>

      {/*
        The credentials step owns its own Clear + Continue controls (the latter
        gated on a configured key), so the shared footer is hidden there to avoid
        a second, ungated Continue button.
      */}
      {draft.step !== 'credentials' && (
        <div className={controlsClass}>
          <Button variant="secondary" onClick={goBack} disabled={isFirstStep}>
            ← Back
          </Button>
          <Button variant="primary" onClick={goNext} disabled={isLastStep || !canAdvance}>
            Continue →
          </Button>
        </div>
      )}

      {/* Resume / Start over prompt: shown when a saved draft is found on load. */}
      {!isHydrating && pendingDraft && (
        <div
          className={resumeOverlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby="studio-resume-title"
        >
          <div className={resumeCardClass}>
            <h2 id="studio-resume-title">Resume your draft?</h2>
            <p>
              You have an in-progress Studio draft
              {pendingDraft.categoryName ? ` for "${pendingDraft.categoryName}"` : ''}. Resume where
              you left off, or start over with a clean slate.
            </p>
            <div className={resumeActionsClass}>
              <Button variant="secondary" onClick={discardDraft}>
                Start over
              </Button>
              <Button variant="primary" onClick={resumeDraft}>
                Resume
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default Studio;
