import { test, expect } from '@playwright/test';

test.describe('E2E - flujo de búsqueda NoLimits', () => {
  test('usuario busca una obra desde Home y navega a resultados', async ({ page }) => {
    await page.goto('/');

    const input = page.getByLabel('Buscar obras');

    await expect(input).toBeVisible();

    await input.fill('Naruto');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=Naruto&type=all/);
    await expect(page.getByText(/Naruto/i)).toBeVisible();
  });

  test('usuario cambia el filtro de búsqueda desde resultados', async ({ page }) => {
    await page.goto('/');

    const input = page.getByLabel('Buscar obras');

    await input.fill('Naruto');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=Naruto&type=all/);

    const tabAnime = page.getByRole('tab', { name: /anime/i });

    await expect(tabAnime).toBeVisible();

    await tabAnime.click();

    await expect(page).toHaveURL(/\/search\?q=Naruto&type=anime/);
  });

  test('usuario navega a login y visualiza el formulario de acceso', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Iniciar sesión').last()).toBeVisible();
  });
});

test.describe('E2E - Flujo completo de usuario', () => {
  test('crear cuenta, login, buscar y agregar a favoritos', async ({ page }) => {
    test.setTimeout(120000);

    const emailUnico = `test_${Date.now()}@nolimits.com`;
    const password = 'Test12345';

    // 1. Crear cuenta
    await page.goto('/login');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    await page.getByPlaceholder('Tu nombre').fill('Usuario');
    await page.getByPlaceholder('Tus apellidos').fill('Prueba');
    await page.getByPlaceholder('tu@email.com').fill(emailUnico);
    await page.getByPlaceholder('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL('/', { timeout: 30000 });

    // 2. Cerrar sesión
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();

    // 3. Iniciar sesión con la misma cuenta
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill(emailUnico);
    await page.getByPlaceholder('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('/', { timeout: 30000 });

    // 4. Buscar producto y entrar al detalle
    await page.getByLabel('Buscar obras').fill('Naruto');
    await page.getByLabel('Buscar obras').press('Enter');
    await expect(page).toHaveURL(/\/search\?q=Naruto/);

    const primeraCard = page.getByRole('button', { name: /^Ver Naruto/i }).first();
    await expect(primeraCard).toBeVisible({ timeout: 15000 });
    await primeraCard.click();

    // 5. Agregar a favoritos
    const botonFavoritos = page.getByRole('button', { name: 'Guardar en mi lista' });
    await expect(botonFavoritos).toBeVisible({ timeout: 10000 });
    await botonFavoritos.click();
    await expect(page.getByRole('button', { name: 'En tu lista' })).toBeVisible();

    // 6. Ir a "Mi Lista" y confirmar que aparece
    await page.goto('/my-list');
    await expect(page.getByText(/obra guardada/i)).toBeVisible();
  });

  test('usuario ve la redirección a plataforma de streaming', async ({ page, context }) => {
    test.setTimeout(120000);

    // No requiere login: la redirección está disponible para cualquier visitante
    await page.goto('/');
    await page.getByLabel('Buscar obras').fill('Avengers');
    await page.getByLabel('Buscar obras').press('Enter');
    await expect(page).toHaveURL(/\/search\?q=Avengers/);

    const primeraPelicula = page.getByRole('button', { name: /^Ver Avengers/i }).first();
    await expect(primeraPelicula).toBeVisible({ timeout: 15000 });
    await primeraPelicula.click();

    const linkRedireccion = page.locator('a[target="_blank"]').first();
    await expect(linkRedireccion).toBeVisible({ timeout: 10000 });

    const [newTab] = await Promise.all([
      context.waitForEvent('page'),
      linkRedireccion.click(),
    ]);
    await newTab.waitForLoadState();
    expect(newTab.url()).not.toBe('about:blank');
  });
});