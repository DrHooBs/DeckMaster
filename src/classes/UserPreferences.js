export class UserPreferences {
  constructor(displayName = 'Trainer', firstName = '', lastName = '', dateOfBirth = '') {
    this.displayName = displayName || 'Trainer';
    this.firstName = firstName || '';
    this.lastName = lastName || '';
    this.dateOfBirth = dateOfBirth || '';
  }

  // Accepts either a JSON string or an already-parsed Object
  static fromJson(data) {
    if (!data) return new UserPreferences();
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return new UserPreferences(
      parsed.displayName,
      parsed.firstName,
      parsed.lastName,
      parsed.dateOfBirth
    );
  }

  // Plain object for IPC serialization
  toObject() {
    return {
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
    };
  }

  // Stringified JSON for disk storage
  toJson() {
    return JSON.stringify(this.toObject(), null, 2);
  }
}

// CommonJS export fallback for main process require()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserPreferences };
}