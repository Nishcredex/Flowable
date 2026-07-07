// // import { useState } from 'react'
// // import type { FormEvent, ChangeEvent } from 'react'
// // import { useNavigate } from 'react-router-dom'
// // import { IcoGoogle, IcoMicrosoft } from '../components/Icons'
// // import { currentUser } from '../pages/data/mock'

// // // `mock.js` is untyped — this describes the shape actually used below.
// // // See the matching note in Sidebar.tsx / TopBar.tsx.
// // interface CurrentUser {
// //   email: string
// // }

// // const user = currentUser as CurrentUser

// // export function LoginPage() {
// //   const navigate = useNavigate()
// //   const [email, setEmail] = useState<string>(user.email)
// //   const [password, setPassword] = useState<string>('')
// //   const [keepSignedIn, setKeepSignedIn] = useState<boolean>(true)

// //   function handleSignIn(e: FormEvent<HTMLFormElement>) {
// //     e.preventDefault()
// //     navigate('/dashboard')
// //   }

// //   return (
// //     <div className="login-wrap">
// //       <form className="login-card" onSubmit={handleSignIn}>
// //         <div className="brand">
// //           <div className="brand-logo">AT</div>
// //           <div>
// //             <div className="brand-name" style={{ color: 'var(--text)' }}>ATRTool</div>
// //             <div className="brand-sub" style={{ color: 'var(--text-muted)' }}>Action Taken &amp; Workflow</div>
// //           </div>
// //         </div>
// //         <h2>Sign in to your workspace</h2>
// //         <div className="hint">Use your corporate credentials or single sign-on.</div>

// //         <div className="form-row">
// //           <label>Email or Employee ID</label>
// //           <input
// //             type="text"
// //             value={email}
// //             onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
// //           />
// //         </div>
// //         <div className="form-row">
// //           <label>Password</label>
// //           <input
// //             type="password"
// //             placeholder="••••••••••"
// //             value={password}
// //             onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
// //           />
// //           <div className="opt-row">
// //             <label className="text-muted">
// //               <input
// //                 type="checkbox"
// //                 checked={keepSignedIn}
// //                 onChange={(e: ChangeEvent<HTMLInputElement>) => setKeepSignedIn(e.target.checked)}
// //               /> Keep me signed in
// //             </label>
// //             <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
// //           </div>
// //         </div>
// //         <button type="submit" className="btn btn-primary login-btn">Sign in</button>

// //         <div className="divider">OR CONTINUE WITH</div>
// //         <button type="button" className="sso-btn" onClick={() => navigate('/dashboard')}>
// //           <IcoGoogle />
// //           Continue with Single Sign-On (SAML)
// //         </button>
// //         <button type="button" className="sso-btn" style={{ marginTop: '8px' }} onClick={() => navigate('/dashboard')}>
// //           <IcoMicrosoft />
// //           Continue with Microsoft Entra ID
// //         </button>

// //         <div className="login-foot">
// //           Protected by audit logging &middot; ISO 27001 &middot; v4.2.1
// //         </div>
// //       </form>
// //     </div>
// //   )
// // }
// import { useState } from 'react'
// import type { FormEvent, ChangeEvent } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { IcoGoogle, IcoMicrosoft } from '../components/Icons'
// import { useAuth } from './AuthContext'
// import type { AuthUser } from './AuthContext'

// // Demo directory — swap this for a real credentials/SSO check once the
// // backend is wired up. Password isn't checked; any value is accepted for
// // any of these emails, so you can test both roles right now.
// const DEMO_USERS: AuthUser[] = [
//   { id: 'souvanik', name: 'Souvanik Ghosh', email: 'souvanik@gmail.com', role: 'admin',   department: 'Audit',      initials: 'SG' },
//   { id: 'r.mehta',  name: 'R. Mehta',        email: 'r.mehta@corp.in',   role: 'admin',   department: 'Compliance', initials: 'RM' },
//   { id: 'p.sharma', name: 'P. Sharma',       email: 'p.sharma@corp.in',  role: 'auditor', department: 'Vigilance',  initials: 'PS' },
//   { id: 'a.nair',   name: 'A. Nair',         email: 'a.nair@corp.in',    role: 'auditor', department: 'Audit',      initials: 'AN' },
// ]

// export function LoginPage() {
//   const navigate = useNavigate()
//   const { login } = useAuth()
//   const [email, setEmail] = useState<string>('')
//   const [password, setPassword] = useState<string>('')
//   const [keepSignedIn, setKeepSignedIn] = useState<boolean>(true)
//   const [error, setError] = useState<string>('')

//   function signInAs(matchEmail: string) {
//     const match = DEMO_USERS.find(
//       (u) => u.email.toLowerCase() === matchEmail.trim().toLowerCase()
//     )
//     if (!match) {
//       setError(`No account found for "${matchEmail}". Try souvanik@gmail.com (admin) or p.sharma@corp.in (auditor).`)
//       return
//     }
//     setError('')
//     login(match) // ← this is the step the old version was missing entirely
//     navigate('/dashboard')
//   }

//   function handleSignIn(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault()
//     signInAs(email)
//   }

//   return (
//     <div className="login-wrap">
//       <form className="login-card" onSubmit={handleSignIn}>
//         <div className="brand">
//           <div className="brand-logo">AT</div>
//           <div>
//             <div className="brand-name" style={{ color: 'var(--text)' }}>ATRTool</div>
//             <div className="brand-sub" style={{ color: 'var(--text-muted)' }}>Action Taken &amp; Workflow</div>
//           </div>
//         </div>
//         <h2>Sign in to your workspace</h2>
//         <div className="hint">Use your corporate credentials or single sign-on.</div>

//         {error && (
//           <div
//             style={{
//               background: 'var(--danger-soft)',
//               color: 'var(--danger)',
//               borderRadius: 6,
//               padding: '8px 12px',
//               fontSize: 12.5,
//               marginBottom: 14,
//             }}
//           >
//             {error}
//           </div>
//         )}

//         <div className="form-row">
//           <label>Email or Employee ID</label>
//           <input
//             type="text"
//             placeholder="souvanik@gmail.com"
//             value={email}
//             onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
//           />
//         </div>
//         <div className="form-row">
//           <label>Password</label>
//           <input
//             type="password"
//             placeholder="••••••••••"
//             value={password}
//             onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
//           />
//           <div className="opt-row">
//             <label className="text-muted">
//               <input
//                 type="checkbox"
//                 checked={keepSignedIn}
//                 onChange={(e: ChangeEvent<HTMLInputElement>) => setKeepSignedIn(e.target.checked)}
//               /> Keep me signed in
//             </label>
//             <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
//           </div>
//         </div>
//         <button type="submit" className="btn btn-primary login-btn">Sign in</button>

//         <div className="divider">OR CONTINUE WITH</div>
//         <button type="button" className="sso-btn" onClick={() => signInAs('souvanik@gmail.com')}>
//           <IcoGoogle />
//           Continue with Single Sign-On (SAML)
//         </button>
//         <button type="button" className="sso-btn" style={{ marginTop: '8px' }} onClick={() => signInAs('p.sharma@corp.in')}>
//           <IcoMicrosoft />
//           Continue with Microsoft Entra ID
//         </button>

//         <div className="login-foot">
//           Protected by audit logging &middot; ISO 27001 &middot; v4.2.1
//         </div>
//       </form>
//     </div>
//   )
// }
import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { IcoGoogle, IcoMicrosoft } from '../components/Icons'
import { useAuth } from './AuthContext'
import type { AuthUser } from './AuthContext'

type DemoUser = AuthUser & {
  password: string
}

// Demo users
const DEMO_USERS: DemoUser[] = [
  {
    id: 'souvanik',
    name: 'Souvanik Ghosh',
    email: 'souvanik@gmail.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Audit',
    initials: 'SG',
  },
  {
    id: 'r.mehta',
    name: 'R. Mehta',
    email: 'r.mehta@corp.in',
    password: 'Admin@123',
    role: 'admin',
    department: 'Compliance',
    initials: 'RM',
  },
  {
    id: 'p.sharma',
    name: 'P. Sharma',
    email: 'p.sharma@corp.in',
    password: 'Auditor@123',
    role: 'auditor',
    department: 'Vigilance',
    initials: 'PS',
  },
  {
    id: 'a.nair',
    name: 'A. Nair',
    email: 'a.nair@corp.in',
    password: 'Auditor@123',
    role: 'auditor',
    department: 'Audit',
    initials: 'AN',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState('')

  function signInAs(matchEmail: string, enteredPassword: string) {
    const match = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === matchEmail.trim().toLowerCase()
    )

    if (!match || match.password !== enteredPassword) {
      setError('Invalid email or password.')
      return
    }

    setError('')

    // Remove password before saving user in auth context
    const { password, ...user } = match

    login(user)
    navigate('/dashboard')
  }

  function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    signInAs(email, password)
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
        >
          Sign in
        </button>

        <div className="divider">OR CONTINUE WITH</div>

        {/* Demo SSO Login */}
        <button
          type="button"
          className="sso-btn"
          onClick={() =>
            signInAs('souvanik@gmail.com', 'Admin@123')
          }
        >
          <IcoGoogle />
          Continue with Single Sign-On (SAML)
        </button>

        <button
          type="button"
          className="sso-btn"
          style={{ marginTop: '8px' }}
          onClick={() =>
            signInAs('p.sharma@corp.in', 'Auditor@123')
          }
        >
          <IcoMicrosoft />
          Continue with Microsoft Entra ID
        </button>

        <div className="login-foot">
          Protected by audit logging &middot; ISO 27001 &middot; v4.2.1
        </div>

        {/* Demo Credentials */}
        <div
          style={{
            marginTop: 20,
            padding: 12,
            background: '#F8FAFC',
            borderRadius: 6,
            fontSize: 13,
            color: '#555',
          }}
        >
          <strong>Demo Credentials</strong>

          <table
            style={{
              width: '100%',
              marginTop: 8,
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th align="left">Role</th>
                <th align="left">Email</th>
                <th align="left">Password</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Admin</td>
                <td>souvanik@gmail.com</td>
                <td>Admin@123</td>
              </tr>
              <tr>
                <td>Admin</td>
                <td>r.mehta@corp.in</td>
                <td>Admin@123</td>
              </tr>
              <tr>
                <td>Auditor</td>
                <td>p.sharma@corp.in</td>
                <td>Auditor@123</td>
              </tr>
              <tr>
                <td>Auditor</td>
                <td>a.nair@corp.in</td>
                <td>Auditor@123</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  )
}