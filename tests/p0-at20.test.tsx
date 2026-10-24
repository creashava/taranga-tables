import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBanners } from '@/components/StatusBanners';

describe('AT20: Fresh clone zero-credential banners', () => {
  it('renders both MOCK MODE and NOT COMPLIANT FOR PRODUCTION banners with no credentials', () => {
    render(<StatusBanners />);

    const mockBanner = screen.getByTestId('mock-mode-banner');
    expect(mockBanner).toBeInTheDocument();
    expect(mockBanner).toHaveTextContent(/MOCK MODE/i);

    const nonCompliantBanner = screen.getByTestId('not-compliant-banner');
    expect(nonCompliantBanner).toBeInTheDocument();
    expect(nonCompliantBanner).toHaveTextContent(/NOT COMPLIANT FOR PRODUCTION/i);
    expect(nonCompliantBanner).toHaveTextContent(/DPDP s9\(1\)/i);
  });
});
