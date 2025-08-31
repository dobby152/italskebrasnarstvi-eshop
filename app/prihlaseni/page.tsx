"use client"

// Disable static generation for login page since it uses auth context
export const dynamic = 'force-dynamic'

import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "../components/header"
import Link from "next/link"
import { useAuth } from "../contexts/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    confirmPassword: ""
  })

  const { login, register, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/ucet')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password)
        if (result.success) {
          router.push('/ucet')
        } else {
          setError(result.error || 'Přihlášení se nezdařilo')
        }
      } else {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError('Hesla se neshodují')
          return
        }
        if (formData.password.length < 8) {
          setError('Heslo musí mít minimálně 8 znaků')
          return
        }

        const result = await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })

        if (result.success) {
          router.push('/ucet')
        } else {
          setError(result.error || 'Registrace se nezdařila')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-md mx-auto">
          <Card className="p-8 shadow-2xl border-0">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-900 mb-2">{isLogin ? "Přihlášení" : "Registrace"}</h1>
              <p className="text-gray-600">{isLogin ? "Přihlaste se do svého účtu" : "Vytvořte si nový účet"}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Jméno
                    </Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      type="text" 
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required 
                      className="border-gray-300 focus:border-black" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Příjmení
                    </Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      type="text" 
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required 
                      className="border-gray-300 focus:border-black" 
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                  E-mail
                </Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                  className="border-gray-300 focus:border-black" 
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                  Heslo
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                    Potvrdit heslo
                  </Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword"
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required 
                    className="border-gray-300 focus:border-black" 
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <Label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                      Zapamatovat si mě
                    </Label>
                  </div>
                  <Link href="/zapomenute-heslo" className="text-sm text-black hover:underline">
                    Zapomenuté heslo?
                  </Link>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                  />
                  <Label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                    Souhlasím s{" "}
                    <Link href="/obchodni-podminky" className="text-black hover:underline">
                      obchodními podmínkami
                    </Link>{" "}
                    a{" "}
                    <Link href="/ochrana-udaju" className="text-black hover:underline">
                      zpracováním osobních údajů
                    </Link>
                  </Label>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 text-lg font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Přihlašování..." : "Registrace..."}
                  </>
                ) : (
                  isLogin ? "Přihlásit se" : "Registrovat se"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {isLogin ? "Nemáte účet?" : "Už máte účet?"}{" "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-black font-semibold hover:underline">
                  {isLogin ? "Registrujte se" : "Přihlaste se"}
                </button>
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="text-center mb-4">
                <span className="text-gray-500 text-sm">nebo se přihlaste pomocí</span>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full border-gray-300 hover:border-black bg-transparent">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Pokračovat s Google
                </Button>
                <Button variant="outline" className="w-full border-gray-300 hover:border-black bg-transparent">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Pokračovat s Facebook
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
