"use client"

import { useState } from "react"
import { Button } from "../app/components/ui/button"
import { Input } from "../app/components/ui/input"
import { Label } from "../app/components/ui/label"
import { Checkbox } from "../app/components/ui/checkbox"
import { Alert, AlertDescription } from "../app/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from "lucide-react"

interface RegisterFormProps {
  onSuccess?: (user: any) => void
  onSwitchToLogin?: () => void
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptsMarketing: false,
    acceptsTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'Křestní jméno je povinné'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Příjmení je povinné'
    }

    if (!formData.email.trim()) {
      errors.email = 'E-mail je povinný'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Neplatný formát e-mailu'
    }

    if (!formData.password) {
      errors.password = 'Heslo je povinné'
    } else if (formData.password.length < 6) {
      errors.password = 'Heslo musí mít alespoň 6 znaků'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Hesla se neshodují'
    }

    if (!formData.acceptsTerms) {
      errors.acceptsTerms = 'Musíte souhlasit s obchodními podmínkami'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          acceptsMarketing: formData.acceptsMarketing
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrace se nezdařila')
      }

      // Save tokens
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('sessionToken', data.sessionToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      onSuccess?.(data.user)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrace se nezdařila')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    if (error) setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vytvořit účet
        </h2>
        <p className="text-gray-600">
          Zaregistrujte se pro lepší nakupování
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Křestní jméno *</Label>
            <div className="relative mt-1">
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Jan"
                className="pl-10"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {validationErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Příjmení *</Label>
            <div className="relative mt-1">
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Novák"
                className="pl-10"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {validationErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mailová adresa *</Label>
          <div className="relative mt-1">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="vas@email.cz"
              className="pl-10"
              required
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefon</Label>
          <div className="relative mt-1">
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+420 123 456 789"
              className="pl-10"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Heslo *</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Alespoň 6 znaků"
              className="pl-10 pr-10"
              required
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Potvrdit heslo *</Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Zadejte heslo znovu"
              className="pl-10 pr-10"
              required
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptsTerms"
              checked={formData.acceptsTerms}
              onCheckedChange={(checked) => handleChange('acceptsTerms', checked)}
              className="mt-1"
            />
            <Label htmlFor="acceptsTerms" className="text-sm leading-5">
              Souhlasím s{' '}
              <a href="/obchodni-podminky" className="text-blue-600 hover:text-blue-800">
                obchodními podmínkami
              </a>{' '}
              a{' '}
              <a href="/ochrana-osobnich-udaju" className="text-blue-600 hover:text-blue-800">
                zpracováním osobních údajů
              </a>
            </Label>
          </div>
          {validationErrors.acceptsTerms && (
            <p className="text-sm text-red-600">{validationErrors.acceptsTerms}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptsMarketing"
              checked={formData.acceptsMarketing}
              onCheckedChange={(checked) => handleChange('acceptsMarketing', checked)}
              className="mt-1"
            />
            <Label htmlFor="acceptsMarketing" className="text-sm leading-5">
              Chci dostávat informace o novinkách a akčních nabídkách
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrování...
            </>
          ) : (
            'Vytvořit účet'
          )}
        </Button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Už máte účet?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Přihlaste se
            </button>
          </p>
        </div>
      )}
    </div>
  )
}