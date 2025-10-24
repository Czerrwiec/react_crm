import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentService } from '@/services/student.service'
import { paymentService } from '@/services/payment.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Student, Payment } from '@/types'
import { format } from 'date-fns'

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (studentId: string) => {
    try {
      const [studentData, paymentsData] = await Promise.all([
        studentService.getStudent(studentId),
        paymentService.getPaymentsByStudent(studentId),
      ])
      setStudent(studentData)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = payments
    .filter((p) => p.type === 'course')
    .reduce((sum, p) => sum + p.amount, 0)

  const outstanding = student ? student.coursePrice - totalPaid : 0

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!student) {
    return <div className="p-8">Nie znaleziono kursanta</div>
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => navigate('/admin/students')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót
      </Button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          <div className="mt-2 flex gap-2">
            {!student.active && <Badge variant="secondary">Nieaktywny</Badge>}
            {student.theoryPassed && <Badge>Teoria ✓</Badge>}
            {student.coursePaid && <Badge>Opłacony</Badge>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dane personalne */}
        <Card>
          <CardHeader>
            <CardTitle>Dane personalne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.phone && <div><strong>Telefon:</strong> {student.phone}</div>}
            {student.email && <div><strong>Email:</strong> {student.email}</div>}
            {student.pkkNumber && <div><strong>PKK:</strong> {student.pkkNumber}</div>}
            {student.city && <div><strong>Miasto:</strong> {student.city}</div>}
          </CardContent>
        </Card>

        {/* Postęp kursu */}
        <Card>
          <CardHeader>
            <CardTitle>Postęp kursu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Wyjeżdżone:</strong> {formatHours(student.totalHoursDriven)}</div>
            <div><strong>Teoria:</strong> {student.theoryPassed ? '✓ Zdana' : '✗ Nie zdana'}</div>
            <div><strong>Egzamin wewnętrzny:</strong> {student.internalExamPassed ? '✓ Zdany' : '✗ Nie zdany'}</div>
            {student.courseStartDate && (
              <div><strong>Rozpoczęcie:</strong> {format(new Date(student.courseStartDate), 'dd.MM.yyyy')}</div>
            )}
          </CardContent>
        </Card>

        {/* Płatności */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Płatności</CardTitle>
              <AddPaymentDialog
                studentId={student.id}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={() => id && loadData(id)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
              <div>
                <div className="text-sm text-muted-foreground">Cena kursu</div>
                <div className="text-2xl font-bold">{student.coursePrice.toFixed(2)} zł</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wpłacono</div>
                <div className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} zł</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Do zapłaty</div>
                <div className={`text-2xl font-bold ${outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {outstanding.toFixed(2)} zł
                </div>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Brak płatności</div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{payment.amount.toFixed(2)} zł</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')} •{' '}
                        {payment.type === 'course' ? 'Kurs' : 'Dodatkowe'} •{' '}
                        {payment.method === 'cash' ? 'Gotówka' : payment.method === 'card' ? 'Karta' : 'Przelew'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (confirm('Usunąć płatność?')) {
                          await paymentService.deletePayment(payment.id)
                          id && loadData(id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AddPaymentDialog({
  studentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  studentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'course' | 'extra_lessons'>('course')
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await paymentService.createPayment({
        studentId,
        amount: parseFloat(amount),
        type,
        method,
        createdBy: null,
        updatedBy: null,
        updatedAt: null,
      })
      onSuccess()
      onOpenChange(false)
      setAmount('')
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Błąd dodawania płatności')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj płatność
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj płatność</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Kwota (zł)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Typ</Label>
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="course">Kurs</option>
              <option value="extra_lessons">Dodatkowe godziny</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="method">Metoda</Label>
            <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as any)}>
              <option value="cash">Gotówka</option>
              <option value="card">Karta</option>
              <option value="transfer">Przelew</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Dodawanie...' : 'Dodaj'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}