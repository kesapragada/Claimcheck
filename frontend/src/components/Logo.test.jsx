//CLAIMCHECK/frontend/src/components/Logo.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';

describe('Logo Component', () => {
  it('renders the application name correctly', () => {
    render(<Logo />);
    
    // Check if the text "ClaimCheck" is in the document
    const logoText = screen.getByText(/ClaimCheck/i);
    expect(logoText).toBeInTheDocument();
  });
});