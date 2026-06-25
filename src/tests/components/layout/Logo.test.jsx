import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Logo from '../../../components/layout/Logo';

describe('Logo', () => {
  const renderLogo = (props = {}) =>
    render(
      <MemoryRouter>
        <Logo {...props} />
      </MemoryRouter>
    );

  it('renderiza el logo completo por defecto', () => {
    renderLogo();

    expect(screen.getByText('no')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('limits')).toBeInTheDocument();
  });

  it('renderiza la versión compacta', () => {
    renderLogo({ variant: 'compact' });

    expect(screen.getByText('n')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('l')).toBeInTheDocument();

    expect(screen.queryByText('limits')).not.toBeInTheDocument();
  });

  it('usa colores blancos en mono-white', () => {
    renderLogo({ variant: 'mono-white' });

    const noText = screen.getByText('no');
    const slash = screen.getByText('/');
    const limits = screen.getByText('limits');

    expect(noText).toHaveStyle({ color: '#FFFFFF' });
    expect(slash).toHaveStyle({ color: '#FFFFFF' });
    expect(limits).toHaveStyle({ color: '#FFFFFF' });
  });

  it('usa color principal en variante dark', () => {
    renderLogo({ variant: 'dark' });

    const noText = screen.getByText('no');
    const slash = screen.getByText('/');

    expect(noText).toHaveStyle({
      color: 'var(--nl-text-primary)',
    });

    expect(slash).toHaveStyle({
      color: 'var(--nl-accent)',
    });
  });

  it('usa tamaño sm', () => {
    renderLogo({ size: 'sm' });

    const logo = screen.getByText('no').parentElement;

    expect(logo).toHaveStyle({
      fontSize: '16px',
    });
  });

  it('usa tamaño md', () => {
    renderLogo({ size: 'md' });

    const logo = screen.getByText('no').parentElement;

    expect(logo).toHaveStyle({
      fontSize: '22px',
    });
  });

  it('usa tamaño lg', () => {
    renderLogo({ size: 'lg' });

    const logo = screen.getByText('no').parentElement;

    expect(logo).toHaveStyle({
      fontSize: '32px',
    });
  });

  it('usa md como fallback cuando el tamaño no existe', () => {
    render(
      <MemoryRouter>
        <Logo size={'invalido'} />
      </MemoryRouter>
    );

    const logo = screen.getByText('no').parentElement;

    expect(logo).toHaveStyle({
      fontSize: '22px',
    });
  });

  it('contiene un enlace hacia la página principal', () => {
    renderLogo();

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', '/');
  });

  it('posee aria-label accesible', () => {
    renderLogo();

    expect(
      screen.getByLabelText('no/limits — inicio')
    ).toBeInTheDocument();
  });
});