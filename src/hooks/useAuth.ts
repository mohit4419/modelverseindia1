/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth as useAuthFromContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthFromContext();
}
