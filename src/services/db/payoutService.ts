/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Payout, PayoutStatus } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureUserExistsInDb, ensureModelExistsInDb } from './helpers';
import { SEED_PAYOUTS, SEED_USERS, SEED_MODELS } from './seedData';
import { auditService } from './auditService';

export const payoutService = {
  subscribeToPayouts(callback: (payouts: Payout[]) => void): () => void {
    if (isSupabaseAvailable && supabase) {
      const channel = supabase
        .channel('schema-db-changes-payouts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payouts' },
          async () => {
            const fresh = await this.getPayouts();
            callback(fresh);
          }
        )
        .subscribe();

      this.getPayouts().then(callback);

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      this.getPayouts().then(callback);
      return () => {};
    }
  },

  async getPayouts(): Promise<Payout[]> {
    let dbPayouts: Payout[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('payouts').select('*');
        if (!error && data) {
          dbPayouts = data as Payout[];
        }
      } catch (e) {
        console.error('Supabase payouts fetch failed', e);
      }
    }
    const local = localStorage.getItem('mvi_payouts');
    const localPayouts: Payout[] = local ? JSON.parse(local) : SEED_PAYOUTS;

    const mergedMap = new Map<string, Payout>();
    SEED_PAYOUTS.forEach(p => mergedMap.set(p.id, p));
    localPayouts.forEach(p => mergedMap.set(p.id, p));
    dbPayouts.forEach(p => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  },

  async savePayout(payout: Payout): Promise<void> {
    try {
      const payouts = await this.getPayouts();
      const idx = payouts.findIndex(p => p.id === payout.id);
      if (idx >= 0) {
        payouts[idx] = payout;
      } else {
        payouts.push(payout);
      }
      localStorage.setItem('mvi_payouts', JSON.stringify(payouts));
    } catch (localErr) {
      console.error('Local storage savePayout failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await ensureUserExistsInDb(payout.clientId, payout.clientName, undefined, SEED_USERS);
        await ensureModelExistsInDb(payout.modelId, SEED_MODELS);
        const { error } = await supabase
          .from('payouts')
          .upsert(removeUndefined(payout));
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase payouts save failed (falling back to local):', e);
      }
    }
  },

  async updatePayoutStatus(payoutId: string, status: PayoutStatus, reference?: string, notes?: string): Promise<void> {
    const payouts = await this.getPayouts();
    const match = payouts.find(p => p.id === payoutId);
    if (match) {
      match.escrowStatus = status;
      if (status === 'released') {
        match.releasedAt = new Date().toISOString();
        if (reference) match.transactionReference = reference;
      }
      if (notes) match.payoutNotes = notes;

      await this.savePayout(match);

      await auditService.addAuditLog({
        action: `Payout Status: ${status.toUpperCase()}`,
        details: `Payout of ₹${match.amount.toLocaleString('en-IN')} for campaign "${match.brandName}" to model ${match.modelName} was updated to ${status}.${reference ? ` Tx Ref: ${reference}` : ''}`,
        entityId: payoutId,
        entityType: 'payout'
      });
    }
  }
};
