/**
 * GasLeap Demo SDK - Simplified API optimized for hackathon demo
 * 
 * This is a streamlined version of the full SDK designed for
 * quick integration and reliable demo performance.
 */

import { QuickSponsorResult, SimpleDappConfig, GasLeapError, ErrorCode } from './types';

export class GasLeapDemoSDK {
  private static instance: GasLeapDemoSDK;
  private config: SimpleDappConfig | null = null;
  private gasSavings: number = 0;

  private constructor() {}

  static getInstance(): GasLeapDemoSDK {
    if (!GasLeapDemoSDK.instance) {
      GasLeapDemoSDK.instance = new GasLeapDemoSDK();
    }
    return GasLeapDemoSDK.instance;
  }

  /**
   * Ultra-simple demo API for quick sponsorship
   */
  static async quickSponsor(
    targetChain: string,
    call: any,
    poolId: string
  ): Promise<QuickSponsorResult> {
    const instance = GasLeapDemoSDK.getInstance();
    
    try {
      // Simulate network delay for realistic demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful sponsorship for demo
      const gasSaved = Math.floor(Math.random() * 50) + 10; // 10-60 units
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Update gas savings counter
      instance.gasSavings += gasSaved;

      return {
        success: true,
        txHash,
        gasSaved,
      };
    } catch (error) {
      return {
        success: false,
        txHash: '',
        gasSaved: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * One-line integration for dApps
   */
  static enableForDapp(dappConfig: SimpleDappConfig): void {
    const instance = GasLeapDemoSDK.getInstance();
    instance.config = dappConfig;
  }

  /**
   * Live gas savings counter
   */
  async getGasSavings(): Promise<number> {
    return this.gasSavings;
  }

  /**
   * Reset demo state (for multiple demo runs)
   */
  static resetDemo(): void {
    const instance = GasLeapDemoSDK.getInstance();
    instance.gasSavings = 0;
  }

  /**
   * Check if demo mode is enabled
   */
  static isDemoMode(): boolean {
    return process.env.REACT_APP_DEMO_MODE === 'true' || 
           process.env.DEMO_MODE === 'true';
  }
}