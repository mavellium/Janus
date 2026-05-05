import { randomUUID } from 'crypto'
import { InvalidEmailError, InvalidPasswordError } from './errors'

export type UserRole = 'ADMIN' | 'DEFAULT'

export interface UserProps {
  id: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
}

export class User {
  private constructor(private props: UserProps) {}

  get id() { return this.props.id }
  get email() { return this.props.email }
  get password() { return this.props.password }
  get role() { return this.props.role }
  get createdAt() { return this.props.createdAt }

  static create(input: { email: string; hashedPassword: string }): User {
    const email = input.email.trim().toLowerCase()
    if (!email.includes('@') || email.length < 3) throw new InvalidEmailError(email)
    if (!input.hashedPassword) throw new InvalidPasswordError()

    return new User({
      id: randomUUID(),
      email,
      password: input.hashedPassword,
      role: 'DEFAULT',
      createdAt: new Date(),
    })
  }

  static reconstitute(props: UserProps): User {
    return new User(props)
  }

  toObject(): UserProps {
    return { ...this.props }
  }
}
