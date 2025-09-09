"use client"

import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Checkbox } from "../components/ui/checkbox"
import { CreditCard, Truck, User, Phone, Mail, Building, Check, Lock, ArrowLeft, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import Header from "../components/header"
import Link from "next/link"
import { useCart } from "../context/cart-context"
import { Badge } from "../components/ui/badge"


// Client-only checkout content
function CheckoutContent() {
  const { items: cartItems, totalPrice } = useCart()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Billing address
    billingStreet: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "Česká republika",
    // Shipping
    shippingMethod: "standard",
    sameAsbilling: true,
    shippingStreet: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "Česká republika",
    // Payment
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
    // Company (optional)
    isCompany: false,
    companyName: "",
    ico: "",
    dic: "",
    // Agreements
    termsAccepted: false,
    newsletterSubscribe: false,
  })

  const subtotal = totalPrice
  const savings = 0 // Simplified for now
  const shippingCost = formData.shippingMethod === "express" ? 299 : subtotal >= 2500 ? 0 : 199
  const total = subtotal + shippingCost

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone
      case 2:
        return (
          formData.billingStreet &&
          formData.billingCity &&
          formData.billingPostalCode &&
          (!formData.sameAsbilling || (formData.shippingStreet && formData.shippingCity && formData.shippingPostalCode))
        )
      case 3:
        if (formData.paymentMethod === "card") {
          return formData.cardNumber && formData.cardExpiry && formData.cardCvc && formData.cardName
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1))
  }

  const steps = [
    { number: 1, title: "Osobní údaje", icon: User },
    { number: 2, title: "Doručení", icon: Truck },
    { number: 3, title: "Platba", icon: CreditCard },
    { number: 4, title: "Shrnutí", icon: Check },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="bg-gray-50 py-8 border-b">
        <div className="container mx-auto px-6">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-black">
              Domů
            </Link>
            <span className="mx-2">/</span>
            <Link href="/kosik" className="hover:text-black">
              Košík
            </Link>
            <span className="mx-2">/</span>
            <span className="text-black font-medium">Pokladna</span>
          </nav>

          <h1 className="text-4xl font-black text-gray-900 mb-6">Dokončení objednávky</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between max-w-2xl">
            {steps?.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      currentStep >= step.number
                        ? "bg-black text-white"
                        : currentStep === step.number
                          ? "bg-gray-200 text-gray-900"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className={`font-medium ${currentStep >= step.number ? "text-black" : "text-gray-500"}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${currentStep > step.number ? "bg-black" : "bg-gray-300"}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="p-8 shadow-xl border-0">
                <div className="flex items-center gap-4 mb-8">
                  <User className="h-8 w-8 text-gray-900" />
                  <h2 className="text-3xl font-black text-gray-900">Osobní údaje</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Jméno *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Příjmení *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                      Telefon *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      placeholder="+420 777 123 456"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCompany"
                      checked={formData.isCompany}
                      onCheckedChange={(checked) => handleInputChange("isCompany", checked)}
                    />
                    <Label htmlFor="isCompany" className="text-sm text-gray-700">
                      Nakupuji jako firma
                    </Label>
                  </div>

                  {formData.isCompany && (
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">
                          Název firmy *
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange("companyName", e.target.value)}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ico" className="text-sm font-medium text-gray-700 mb-2 block">
                          IČO *
                        </Label>
                        <Input
                          id="ico"
                          value={formData.ico}
                          onChange={(e) => handleInputChange("ico", e.target.value)}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="dic" className="text-sm font-medium text-gray-700 mb-2 block">
                          DIČ
                        </Label>
                        <Input
                          id="dic"
                          value={formData.dic}
                          onChange={(e) => handleInputChange("dic", e.target.value)}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Step 2: Delivery */}
            {currentStep === 2 && (
              <Card className="p-8 shadow-xl border-0">
                <div className="flex items-center gap-4 mb-8">
                  <Truck className="h-8 w-8 text-gray-900" />
                  <h2 className="text-3xl font-black text-gray-900">Doručení a fakturace</h2>
                </div>

                <div className="space-y-8">
                  {/* Billing Address */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Fakturační adresa</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label htmlFor="billingStreet" className="text-sm font-medium text-gray-700 mb-2 block">
                          Ulice a číslo popisné *
                        </Label>
                        <Input
                          id="billingStreet"
                          value={formData.billingStreet}
                          onChange={(e) => handleInputChange("billingStreet", e.target.value)}
                          className="border-gray-300 focus:border-black"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingCity" className="text-sm font-medium text-gray-700 mb-2 block">
                          Město *
                        </Label>
                        <Input
                          id="billingCity"
                          value={formData.billingCity}
                          onChange={(e) => handleInputChange("billingCity", e.target.value)}
                          className="border-gray-300 focus:border-black"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingPostalCode" className="text-sm font-medium text-gray-700 mb-2 block">
                          PSČ *
                        </Label>
                        <Input
                          id="billingPostalCode"
                          value={formData.billingPostalCode}
                          onChange={(e) => handleInputChange("billingPostalCode", e.target.value)}
                          className="border-gray-300 focus:border-black"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Způsob doručení</h3>
                    <RadioGroup
                      value={formData.shippingMethod}
                      onValueChange={(value) => handleInputChange("shippingMethod", value)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-black transition-colors">
                          <RadioGroupItem value="standard" id="standard" />
                          <div className="flex-1">
                            <Label htmlFor="standard" className="font-medium cursor-pointer">
                              Standardní doručení (2-3 dny)
                            </Label>
                            <p className="text-sm text-gray-600">Česká pošta</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{subtotal >= 2500 ? "Zdarma" : "199 Kč"}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-black transition-colors">
                          <RadioGroupItem value="express" id="express" />
                          <div className="flex-1">
                            <Label htmlFor="express" className="font-medium cursor-pointer">
                              Expresní doručení (1-2 dny)
                            </Label>
                            <p className="text-sm text-gray-600">DPD Express</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">299 Kč</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-black transition-colors">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <div className="flex-1">
                            <Label htmlFor="pickup" className="font-medium cursor-pointer">
                              Osobní odběr v partnerské prodejně
                            </Label>
                            <p className="text-sm text-gray-600">Praha - Westfield Chodov</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-green-600">Zdarma</span>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Shipping Address */}
                  {formData.shippingMethod !== "pickup" && (
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="sameAsbilling"
                          checked={formData.sameAsbilling}
                          onCheckedChange={(checked) => handleInputChange("sameAsbilling", checked)}
                        />
                        <Label htmlFor="sameAsbilling" className="text-sm text-gray-700">
                          Doručovací adresa je stejná jako fakturační
                        </Label>
                      </div>

                      {!formData.sameAsbilling && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Doručovací adresa</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <Label htmlFor="shippingStreet" className="text-sm font-medium text-gray-700 mb-2 block">
                                Ulice a číslo popisné *
                              </Label>
                              <Input
                                id="shippingStreet"
                                value={formData.shippingStreet}
                                onChange={(e) => handleInputChange("shippingStreet", e.target.value)}
                                className="border-gray-300 focus:border-black"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="shippingCity" className="text-sm font-medium text-gray-700 mb-2 block">
                                Město *
                              </Label>
                              <Input
                                id="shippingCity"
                                value={formData.shippingCity}
                                onChange={(e) => handleInputChange("shippingCity", e.target.value)}
                                className="border-gray-300 focus:border-black"
                                required
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="shippingPostalCode"
                                className="text-sm font-medium text-gray-700 mb-2 block"
                              >
                                PSČ *
                              </Label>
                              <Input
                                id="shippingPostalCode"
                                value={formData.shippingPostalCode}
                                onChange={(e) => handleInputChange("shippingPostalCode", e.target.value)}
                                className="border-gray-300 focus:border-black"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <Card className="p-8 shadow-xl border-0">
                <div className="flex items-center gap-4 mb-8">
                  <CreditCard className="h-8 w-8 text-gray-900" />
                  <h2 className="text-3xl font-black text-gray-900">Způsob platby</h2>
                </div>

                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange("paymentMethod", value)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <div className="flex-1">
                        <Label htmlFor="card" className="font-medium cursor-pointer flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Platební karta
                        </Label>
                        <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
                      <RadioGroupItem value="bank" id="bank" />
                      <div className="flex-1">
                        <Label htmlFor="bank" className="font-medium cursor-pointer flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Bankovní převod
                        </Label>
                        <p className="text-sm text-gray-600">Platba na účet, zpracování 1-2 dny</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <div className="flex-1">
                        <Label htmlFor="paypal" className="font-medium cursor-pointer flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h8.418c2.508 0 4.514.893 5.895 2.968 1.382 2.075 1.382 4.149 0 6.224-1.381 2.075-3.387 2.968-5.895 2.968H9.906l-.618 3.177h4.32c.39 0 .715.317.715.707 0 .39-.325.707-.715.707H7.076z" />
                          </svg>
                          PayPal
                        </Label>
                        <p className="text-sm text-gray-600">Rychlá a bezpečná platba</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {formData.paymentMethod === "card" && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Údaje platební karty</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                          Číslo karty *
                        </Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                          className="border-gray-300 focus:border-black"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry" className="text-sm font-medium text-gray-700 mb-2 block">
                            Platnost *
                          </Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange("cardExpiry", e.target.value)}
                            className="border-gray-300 focus:border-black"
                            placeholder="MM/RR"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardCvc" className="text-sm font-medium text-gray-700 mb-2 block">
                            CVC *
                          </Label>
                          <Input
                            id="cardCvc"
                            value={formData.cardCvc}
                            onChange={(e) => handleInputChange("cardCvc", e.target.value)}
                            className="border-gray-300 focus:border-black"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cardName" className="text-sm font-medium text-gray-700 mb-2 block">
                          Jméno na kartě *
                        </Label>
                        <Input
                          id="cardName"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange("cardName", e.target.value)}
                          className="border-gray-300 focus:border-black"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <Card className="p-8 shadow-xl border-0">
                <div className="flex items-center gap-4 mb-8">
                  <Check className="h-8 w-8 text-gray-900" />
                  <h2 className="text-3xl font-black text-gray-900">Shrnutí objednávky</h2>
                </div>

                <div className="space-y-8">
                  {/* Personal Info Summary */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Osobní údaje</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="font-semibold">
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p className="text-gray-600">{formData.email}</p>
                      <p className="text-gray-600">{formData.phone}</p>
                      {formData.isCompany && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="font-semibold">{formData.companyName}</p>
                          <p className="text-gray-600">IČO: {formData.ico}</p>
                          {formData.dic && <p className="text-gray-600">DIČ: {formData.dic}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Summary */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Doručení</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="font-semibold mb-2">
                        {formData.shippingMethod === "standard"
                          ? "Standardní doručení (2-3 dny)"
                          : formData.shippingMethod === "express"
                            ? "Expresní doručení (1-2 dny)"
                            : "Osobní odběr v partnerské prodejně"}
                      </p>
                      {formData.shippingMethod !== "pickup" && (
                        <div className="text-gray-600">
                          <p>{formData.sameAsbilling ? formData.billingStreet : formData.shippingStreet}</p>
                          <p>
                            {formData.sameAsbilling ? formData.billingCity : formData.shippingCity}{" "}
                            {formData.sameAsbilling ? formData.billingPostalCode : formData.shippingPostalCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Platba</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="font-semibold">
                        {formData.paymentMethod === "card"
                          ? "Platební karta"
                          : formData.paymentMethod === "bank"
                            ? "Bankovní převod"
                            : "PayPal"}
                      </p>
                      {formData.paymentMethod === "card" && formData.cardNumber && (
                        <p className="text-gray-600">**** **** **** {formData.cardNumber.slice(-4)}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => handleInputChange("termsAccepted", checked)}
                        required
                      />
                      <Label htmlFor="termsAccepted" className="text-sm text-gray-700 leading-relaxed">
                        Souhlasím s{" "}
                        <Link href="/obchodni-podminky" className="text-black hover:underline">
                          obchodními podmínkami
                        </Link>{" "}
                        a{" "}
                        <Link href="/ochrana-udaju" className="text-black hover:underline">
                          zpracováním osobních údajů
                        </Link>{" "}
                        *
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="newsletterSubscribe"
                        checked={formData.newsletterSubscribe}
                        onCheckedChange={(checked) => handleInputChange("newsletterSubscribe", checked)}
                      />
                      <Label htmlFor="newsletterSubscribe" className="text-sm text-gray-700">
                        Chci dostávat novinky a speciální nabídky e-mailem
                      </Label>
                    </div>
                  </div>

                  {/* Final Order Button */}
                  <div className="pt-6 border-t">
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white py-4 text-xl font-bold shadow-xl hover:shadow-2xl transition-all"
                      disabled={!formData.termsAccepted}
                      onClick={() => alert("Objednávka byla úspěšně odeslána!")}
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      Dokončit objednávku za {total.toLocaleString()} Kč
                    </Button>
                    <p className="text-center text-sm text-gray-600 mt-4">Vaše platba je chráněna SSL šifrováním</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-gray-300 hover:border-black bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>

              {currentStep < 4 && (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Pokračovat
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 shadow-xl border-0 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Vaše objednávka</h3>

              <div className="space-y-4 mb-6">
                {cartItems?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      
                      {/* Color information */}
                      {item.attributes?.color && (
                        <div className="flex items-center gap-1 my-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: (item.attributes.color as any)?.hexColor || item.attributes.hexColor?.value || '#CCCCCC' }}
                          />
                          <Badge variant="outline" className="text-xs">
                            {(item.attributes.color as any)?.displayValue || item.attributes.color?.value || 'Barva'}
                          </Badge>
                        </div>
                      )}
                      
                      <p className="text-sm font-semibold">
                        {item.quantity}x {item.price.toLocaleString()} Kč
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t">
                <div className="flex justify-between">
                  <span>Mezisoučet:</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} Kč</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Úspora:</span>
                    <span className="font-semibold">-{savings.toLocaleString()} Kč</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Doprava:</span>
                  <span className={`font-semibold ${shippingCost === 0 ? "text-green-600" : ""}`}>
                    {shippingCost === 0 ? "Zdarma" : `${shippingCost} Kč`}
                  </span>
                </div>

                <div className="flex justify-between text-xl font-black pt-3 border-t">
                  <span>Celkem:</span>
                  <span>{total.toLocaleString()} Kč</span>
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    <span>SSL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>Bezpečné</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    <span>Ověřené</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help Card */}
            <Card className="p-6 shadow-lg border-0 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Potřebujete pomoc?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">+420 774 977 971</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">info@italskeBrasnarstvi.cz</span>
                </div>
                <p className="text-gray-600">Po-Pá: 10:00-16:00</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create client-only wrapper for checkout
function ClientOnlyCheckout() {
  return <CheckoutContent />
}

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-lg">Načítání...</div></div>
  }
  
  return <ClientOnlyCheckout />
}
