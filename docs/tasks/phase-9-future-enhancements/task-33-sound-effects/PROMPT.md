# Task 33: Sound Effects for Duel Actions

## Objective
Add audio feedback for correct answers and skip/pass actions during duels to enhance the game show experience and provide immediate auditory confirmation of actions.

## Status
Not Started

## Priority
**Medium** - Enhancement that improves user experience but not required for core gameplay

## Acceptance Criteria
- [ ] Sound plays when "Correct" button is clicked in Master View
- [ ] Sound plays when "Skip" button is clicked in Master View
- [ ] Sounds play on Audience View synchronized with Master View actions
- [ ] Audio files stored in `/public/sounds/` directory
- [ ] Sounds can be toggled on/off via settings
- [ ] Sound preference persists to localStorage
- [ ] Volume control available (0-100%)
- [ ] No audio glitches or overlapping sounds
- [ ] Graceful fallback if audio files fail to load
- [ ] Works across all modern browsers
- [ ] All tests passing

## Dependencies
- Task 15: Duel Controls (Correct/Skip buttons) - ✅ complete
- Task 17: Audience View Layout - ✅ complete
- Task 23: Cross-window sync - ✅ complete

## Audio Requirements

### Sound Files (Provided by User)
- `correct.mp3` - Play when answer is marked correct
- `skip.mp3` - Play when answer is skipped/passed

**Note**: User will provide the MP3 files. Place them in `/public/sounds/` directory.

### Audio Characteristics
- Short duration (< 2 seconds recommended)
- Clear, non-intrusive sound
- Appropriate volume level (not jarring)
- Format: MP3 (broad browser support)

## Implementation Guidance

### 1. Audio Hook

**File**: `src/hooks/useSound.ts`
```typescript
interface SoundOptions {
  enabled: boolean;
  volume: number; // 0-1
}

export function useSound() {
  const [options, setOptions] = useState<SoundOptions>(() => {
    const stored = localStorage.getItem('the-floor:sound-settings');
    return stored ? JSON.parse(stored) : { enabled: true, volume: 0.7 };
  });

  useEffect(() => {
    localStorage.setItem('the-floor:sound-settings', JSON.stringify(options));
  }, [options]);

  const playSound = useCallback((soundName: 'correct' | 'skip') => {
    if (!options.enabled) return;

    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = options.volume;

    audio.play().catch((error) => {
      console.warn(`Failed to play ${soundName} sound:`, error);
      // Fail silently - audio is enhancement, not critical
    });
  }, [options]);

  const toggleSound = () => {
    setOptions(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const setVolume = (volume: number) => {
    setOptions(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  };

  return {
    playSound,
    toggleSound,
    setVolume,
    soundEnabled: options.enabled,
    volume: options.volume,
  };
}
```

### 2. Integrate with Master View

**File**: `src/pages/MasterView.tsx`
```typescript
import { useSound } from '@/hooks/useSound';

function MasterView() {
  const { playSound } = useSound();

  const handleCorrect = () => {
    playSound('correct');
    // ... existing correct logic
  };

  const handleSkip = () => {
    playSound('skip');
    // ... existing skip logic
  };

  // ... rest of component
}
```

### 3. Sync Sounds to Audience View

Sounds should play on the Audience View when actions occur in Master View:

**Option A: Via BroadcastChannel** (Recommended)
```typescript
// In MasterView - broadcast sound event
channel.postMessage({
  type: 'SOUND_EVENT',
  sound: 'correct' // or 'skip'
});

// In AudienceView - listen for sound events
channel.onmessage = (event) => {
  if (event.data.type === 'SOUND_EVENT') {
    playSound(event.data.sound);
  }
};
```

**Option B: Via Duel State** (If BroadcastChannel extended)
- Add `lastAction` field to DuelState with timestamp
- Audience View detects state changes and plays corresponding sound

### 4. Sound Settings UI

**File**: `src/components/settings/SoundSettings.tsx`
```typescript
interface SoundSettingsProps {
  soundEnabled: boolean;
  volume: number;
  onToggleSound: () => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundSettings({
  soundEnabled,
  volume,
  onToggleSound,
  onVolumeChange,
}: SoundSettingsProps) {
  return (
    <div className={styles['sound-settings']}>
      <label>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={onToggleSound}
        />
        Enable Sound Effects
      </label>

      {soundEnabled && (
        <div className={styles['volume-control']}>
          <label htmlFor="volume">Volume</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          />
          <span>{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
}
```

**Integration Point**: Add to Dashboard settings or create a settings modal accessible from all views.

### 5. Audio Context Considerations

Modern browsers require user interaction before playing audio (autoplay policy):

```typescript
// Initialize AudioContext on first user interaction
let audioContext: AudioContext | null = null;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Call initAudioContext on first button click
document.addEventListener('click', initAudioContext, { once: true });
```

**Note**: Simple `Audio()` API usually works without AudioContext for click-triggered sounds.

## Testing Strategy

### Manual Testing
- [ ] Play correct sound on Master View
- [ ] Play skip sound on Master View
- [ ] Verify sound plays on Audience View when Master View actions occur
- [ ] Toggle sound on/off - verify no sound when disabled
- [ ] Adjust volume - verify volume changes
- [ ] Test with missing audio files - verify graceful fallback
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices

### Automated Testing
```typescript
describe('useSound', () => {
  it('plays sound when enabled', () => {
    const { result } = renderHook(() => useSound());
    // Mock Audio constructor
    expect(() => result.current.playSound('correct')).not.toThrow();
  });

  it('does not play sound when disabled', () => {
    localStorage.setItem('the-floor:sound-settings', JSON.stringify({
      enabled: false,
      volume: 0.7
    }));
    const { result } = renderHook(() => useSound());
    // Verify no audio plays
  });

  it('saves settings to localStorage', () => {
    const { result } = renderHook(() => useSound());
    act(() => {
      result.current.toggleSound();
    });
    const stored = JSON.parse(localStorage.getItem('the-floor:sound-settings')!);
    expect(stored.enabled).toBe(false);
  });
});
```

## Browser Compatibility

### Audio Support
- Modern browsers: Full support for `<audio>` and Audio() API
- Safari: May require user interaction for first sound
- Mobile: May be muted by device settings

### Fallback Strategy
```typescript
function canPlayAudio(): boolean {
  try {
    const audio = new Audio();
    return audio.canPlayType('audio/mpeg') !== '';
  } catch (e) {
    return false;
  }
}

// Use at initialization
if (!canPlayAudio()) {
  console.warn('Audio not supported - sound effects disabled');
}
```

## Success Criteria
- Correct sound plays on both Master and Audience views
- Skip sound plays on both Master and Audience views
- Sounds are synchronized across windows
- Settings persist across sessions
- No audio errors in console
- Works on all target browsers
- Graceful degradation if audio unavailable
- All tests passing

## Out of Scope
- Background music or ambient sounds
- Custom sound selection (user uploads)
- Sound effects for other events (timer warnings, duel end, etc.)
- Advanced audio processing (equalizer, effects)
- Spatial audio or 3D sound
- Multiple simultaneous sounds
- Sound visualization or waveforms
- Accessibility alternatives (visual feedback) - already exists

## UI/UX Considerations

### Settings Placement Options
1. **Dashboard header** - Quick access icon
2. **Settings modal** - Dedicated settings page
3. **Master View controls** - Inline with duel controls
4. **Per-view settings** - Different settings for Master vs Audience

**Recommendation**: Dashboard header icon (🔊/🔇) with dropdown for volume control.

### User Expectations
- Sounds should be subtle, not distracting
- Immediate feedback (< 100ms latency)
- Consistent volume across different sounds
- Easy to disable for quiet environments
- Remember user preference

## Performance Considerations

### Audio Loading
- Preload audio files on page load for instant playback
- Small file sizes (< 50KB per file recommended)
- Lazy load if not needed immediately

### Memory Management
```typescript
// Preload sounds for better performance
const sounds = {
  correct: new Audio('/sounds/correct.mp3'),
  skip: new Audio('/sounds/skip.mp3'),
};

// Preload on app initialization
Object.values(sounds).forEach(audio => audio.load());

// Play preloaded sound
function playPreloadedSound(name: 'correct' | 'skip') {
  const audio = sounds[name];
  audio.currentTime = 0; // Reset to start
  audio.play();
}
```

## Accessibility Considerations

### Sound Alternatives
- Visual feedback already exists (button animations, state changes)
- Sound is supplementary, not primary feedback
- Ensure sound doesn't interfere with screen readers

### WCAG Guidelines
- Provide visual equivalents for all audio (✅ already have)
- Allow users to disable sound (✅ included)
- Respect system audio settings
- Consider users with hearing impairments (sound is optional)

## Future Enhancements
- Additional sound effects (timer warnings, duel start/end)
- Custom sound uploads
- Sound theme selection (game show, retro, modern)
- Audio ducking (lower volume during spoken audio)
- Achievement sounds (first win, comeback, etc.)

## Notes
- MP3 format has broad browser support (99%+ coverage)
- Keep sounds short and punchy for game show feel
- Test actual audio files provided by user before finalizing
- Consider TV show sound effects for authenticity
- Ensure sounds don't violate copyright (user-provided files)
- Mobile devices may have audio disabled by default
- Consider adding a "Test Sound" button in settings
