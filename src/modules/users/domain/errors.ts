export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Email inválido: ${email}`, 'INVALID_EMAIL')
  }
}

export class InvalidPasswordError extends DomainError {
  constructor() {
    super('Senha inválida', 'INVALID_PASSWORD')
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email ${email} já está em uso`, 'EMAIL_ALREADY_EXISTS')
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Credenciais inválidas', 'INVALID_CREDENTIALS')
  }
}
