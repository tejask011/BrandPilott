import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LoginPage } from '../src/components/Auth/LoginPage';

describe('Demo Authentication & Login Workstation', () => {
  test('renders LoginPage cleanly with SSR without errors', () => {
    let loggedInUser = '';
    const html = renderToString(
      React.createElement(LoginPage, {
        onLogin: (user) => {
          loggedInUser = user;
        }
      })
    );

    assert.ok(html.includes('BrandPilot'), 'Should render brand header');
    assert.ok(html.includes('Intelligence'), 'Should render Intelligence tag');
    assert.ok(html.includes('admin'), 'Should render demo admin credentials placeholder');
    assert.ok(html.includes('Sign In'), 'Should render Sign In button');
    assert.ok(html.includes('1-Click Quick Demo Login (Admin)'), 'Should render 1-click quick demo login button');
  });

  test('LoginPage contains username and password input fields with demo placeholders', () => {
    const html = renderToString(
      React.createElement(LoginPage, {
        onLogin: () => {}
      })
    );

    assert.ok(html.includes('placeholder="admin"'), 'Input fields should have placeholder="admin"');
    assert.ok(html.includes('id="username-input"'), 'Should render username input');
    assert.ok(html.includes('id="password-input"'), 'Should render password input');
  });
});
