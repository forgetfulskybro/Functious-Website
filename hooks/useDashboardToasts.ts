'use client';

import { useEffect, useRef } from 'react';
import { showErrorToast, showToast } from '@/components/ui/Toast';

export function useDashboardToasts(loading: boolean, error: string | null) {
  const loadingShown = useRef(false);
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !loadingShown.current) {
      loadingShown.current = true;
      showToast('Loading', { description: 'Loading data...' });
    }
    if (!loading) loadingShown.current = false;
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) shownError.current = null;
  }, [error]);
}
