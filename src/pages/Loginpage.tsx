
import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { IcoGoogle, IcoMicrosoft } from '../components/Icons'
import { useAuth, getDashboardPath } from './AuthContext'
import { loginWithFlowable, FlowableLoginError } from './services/flowableApi'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await loginWithFlowable(email, password)
      login(user)
      navigate(getDashboardPath(user.role))
    } catch (err) {
      setError(
        err instanceof FlowableLoginError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  // SSO isn't wired up to Flowable yet — surface that instead of silently
  // doing nothing (or worse, faking a login).
  function handleSsoClick(providerName: string) {
    setError(`${providerName} sign-on isn't set up yet. Please sign in with your email and password.`)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSignIn}>
        <div className="brand">
          <div className="brand-logo">AT</div>
          <div>
            <div
              className="brand-name"
              style={{ color: 'var(--text)' }}
            >
              ATRTool
            </div>
            <div
              className="brand-sub"
              style={{ color: 'var(--text-muted)' }}
            >
              Action Taken &amp; Workflow
            </div>
          </div>
        </div>

        <h2>Sign in to your workspace</h2>
        <div className="hint">
          Use your corporate credentials or single sign-on.
        </div>

        {error && (
          <div
            style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              border: '1px solid #FCA5A5',
              borderRadius: 6,
              padding: '10px',
              marginBottom: 15,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div className="form-row">
          <label>Email or Employee ID</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
          />

          <div className="opt-row">
            <label className="text-muted">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setKeepSignedIn(e.target.checked)
                }
              />{' '}
              Keep me signed in
            </label>

            <a
              href="#forgot"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary login-btn"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="divider">OR CONTINUE WITH</div>

        <button
          type="button"
          className="sso-btn"
          onClick={() => handleSsoClick('Single Sign-On (SAML)')}
        >
          <IcoGoogle />
          Continue with Single Sign-On (SAML)
        </button>

        <button
          type="button"
          className="sso-btn"
          style={{ marginTop: '8px' }}
          onClick={() => handleSsoClick('Microsoft Entra ID')}
        >
          <IcoMicrosoft />
          Continue with Microsoft Entra ID
        </button>

        <div className="login-foot">
          Protected by audit logging &middot; ISO 27001 &middot; v4.2.1
        </div>
      </form>
    </div>
  )
}