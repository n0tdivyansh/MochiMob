/**
 * CrazyGames SDK v3 Integration Module for Mochi Mob
 *
 * Provides lifecycle tracking (loadingStart, loadingStop, gameplayStart,
 * gameplayStop, happytime), interstitial (midgame) and rewarded video ads,
 * banners, and automatic audio/gameplay pause orchestration.
 *
 * Fallback mode ensures 100% offline, local dev, and ad-blocker tolerance.
 */

class CrazyGamesManager {
  constructor() {
    this.sdk = null;
    this.initialized = false;
    this.isGameplayActive = false;
    this.lastMidgameTime = 0;
    this.midgameCooldown = 60; // 60s cooldown between interstitial midgame ads
    this._adInProgress = false;
    this._audio = null;
  }

  setAudio(audioInstance) {
    this._audio = audioInstance;
  }

  /** Initialize the CrazyGames SDK v3. Call early on startup. */
  async init(audioInstance = null) {
    if (audioInstance) this._audio = audioInstance;
    if (this.initialized) return;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        await this.sdk.init();
        this.initialized = true;
        console.log('[CrazyGames] SDK v3 initialized successfully');
      } else {
        console.warn('[CrazyGames] SDK script not detected; running in fallback mode');
      }
    } catch (err) {
      console.warn('[CrazyGames] SDK initialization warning:', err);
    } finally {
      this.initialized = true;
    }
  }

  get isAvailable() {
    return !!(this.sdk && typeof this.sdk.ad?.requestAd === 'function');
  }

  // -------------------------------------------------- Lifecycle hooks
  loadingStart() {
    if (!this.initialized || !this.sdk?.game?.loadingStart) return;
    try {
      this.sdk.game.loadingStart();
    } catch (e) {
      console.warn('[CrazyGames] loadingStart error:', e);
    }
  }

  loadingStop() {
    if (!this.initialized || !this.sdk?.game?.loadingStop) return;
    try {
      this.sdk.game.loadingStop();
    } catch (e) {
      console.warn('[CrazyGames] loadingStop error:', e);
    }
  }

  gameplayStart() {
    if (!this.initialized || this.isGameplayActive) return;
    this.isGameplayActive = true;
    try {
      if (this.sdk?.game?.gameplayStart) {
        this.sdk.game.gameplayStart();
      }
    } catch (e) {
      console.warn('[CrazyGames] gameplayStart error:', e);
    }
  }

  gameplayStop() {
    if (!this.initialized || !this.isGameplayActive) return;
    this.isGameplayActive = false;
    try {
      if (this.sdk?.game?.gameplayStop) {
        this.sdk.game.gameplayStop();
      }
    } catch (e) {
      console.warn('[CrazyGames] gameplayStop error:', e);
    }
  }

  /** Trigger confetti / celebration on CrazyGames portal for major achievements */
  happytime() {
    if (!this.initialized || !this.sdk?.game?.happytime) return;
    const now = Date.now();
    if (this._lastHappytime && now - this._lastHappytime < 4000) return;
    this._lastHappytime = now;
    try {
      this.sdk.game.happytime();
    } catch (e) {
      console.warn('[CrazyGames] happytime error:', e);
    }
  }

  // -------------------------------------------------- Advertisements
  canShowMidgame() {
    const elapsed = (Date.now() - this.lastMidgameTime) / 1000;
    return elapsed >= this.midgameCooldown;
  }

  /**
   * Request a Midgame (Interstitial) Ad.
   * Pauses audio and gameplay during the ad, then resumes.
   */
  async requestMidgameAd({ onStart, onComplete } = {}) {
    if (this._adInProgress) return;
    if (!this.canShowMidgame()) {
      if (onComplete) onComplete();
      return;
    }

    this._adInProgress = true;
    this.lastMidgameTime = Date.now();
    this.gameplayStop();
    this._audio?.setSystemMuted?.(true);

    if (onStart) onStart();

    if (!this.isAvailable) {
      console.log('[CrazyGames] Simulated midgame ad (dev mode)');
      setTimeout(() => {
        this._audio?.setSystemMuted?.(false);
        this._adInProgress = false;
        if (onComplete) onComplete();
      }, 500);
      return;
    }

    try {
      await this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          this._audio?.setSystemMuted?.(true);
        },
        adFinished: () => {
          this._audio?.setSystemMuted?.(false);
          this._adInProgress = false;
          if (onComplete) onComplete();
        },
        adError: (error) => {
          console.warn('[CrazyGames] Midgame ad error / unfilled:', error);
          this._audio?.setSystemMuted?.(false);
          this._adInProgress = false;
          if (onComplete) onComplete();
        },
      });
    } catch (err) {
      console.warn('[CrazyGames] Midgame ad exception:', err);
      this._audio?.setSystemMuted?.(false);
      this._adInProgress = false;
      if (onComplete) onComplete();
    }
  }

  /**
   * Request a Rewarded Video Ad.
   * If finished, onRewarded is called to award the prize.
   */
  async requestRewardedAd({ onStart, onRewarded, onError, onComplete } = {}) {
    if (this._adInProgress) return;
    this._adInProgress = true;
    this.gameplayStop();
    this._audio?.setSystemMuted?.(true);

    if (onStart) onStart();

    if (!this.isAvailable) {
      console.log('[CrazyGames] Simulated rewarded ad (dev mode - reward granted)');
      setTimeout(() => {
        this._audio?.setSystemMuted?.(false);
        this._adInProgress = false;
        if (onRewarded) onRewarded();
        if (onComplete) onComplete();
      }, 600);
      return;
    }

    try {
      await this.sdk.ad.requestAd('rewarded', {
        adStarted: () => {
          this._audio?.setSystemMuted?.(true);
        },
        adFinished: () => {
          this._audio?.setSystemMuted?.(false);
          this._adInProgress = false;
          if (onRewarded) onRewarded();
          if (onComplete) onComplete();
        },
        adError: (error) => {
          console.warn('[CrazyGames] Rewarded ad error:', error);
          this._audio?.setSystemMuted?.(false);
          this._adInProgress = false;
          if (onError) onError(error);
          if (onComplete) onComplete();
        },
      });
    } catch (err) {
      console.warn('[CrazyGames] Rewarded ad exception:', err);
      this._audio?.setSystemMuted?.(false);
      this._adInProgress = false;
      if (onError) onError(err);
      if (onComplete) onComplete();
    }
  }

  // -------------------------------------------------- Banners
  async requestBanner(containerId, width = 300, height = 250) {
    if (!this.isAvailable || !this.sdk.banner) return;
    try {
      await this.sdk.banner.requestBanner({
        id: containerId,
        width,
        height,
      });
    } catch (err) {
      console.warn('[CrazyGames] Banner request error:', err);
    }
  }

  clearBanner(containerId) {
    if (!this.isAvailable || !this.sdk.banner) return;
    try {
      this.sdk.banner.clearBanner(containerId);
    } catch (err) {
      console.warn('[CrazyGames] Clear banner error:', err);
    }
  }

  clearAllBanners() {
    if (!this.isAvailable || !this.sdk.banner) return;
    try {
      this.sdk.banner.clearAllBanners();
    } catch (err) {
      console.warn('[CrazyGames] Clear all banners error:', err);
    }
  }
}

export const crazygames = new CrazyGamesManager();
