class User {
  final int id;
  final String username;
  final String email;
  final String? fullName;
  final String role;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
        id:       j['id'],
        username: j['username'],
        email:    j['email'],
        fullName: j['full_name'],
        role:     j['role'] ?? 'public',
      );

  bool get isRegistered => role == 'registered' || role == 'admin';
  bool get isAdmin      => role == 'admin';

  String get displayName => fullName?.isNotEmpty == true ? fullName! : username;
}
