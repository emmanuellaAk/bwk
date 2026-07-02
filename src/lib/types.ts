export interface BookingRecord {
  id: string
  name: string
  phone: string
  service: string
  price: number
  deposit: number
  date: string    // "Mon, Jul 13"
  time: string    // "9:00 AM"
  color: string   // "Honey Blonde"
  dayIdx: number  // 0=Mon Jul 13 … 5=Sat Jul 18
}
