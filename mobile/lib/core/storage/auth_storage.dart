import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  static const _storage = FlutterSecureStorage();
  static const _keyToken = 'access_token';
  static const _keyRole  = 'user_role';

  static Future<void> saveToken(String token, {String role = 'public'}) async {
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyRole,  value: role);
  }

  static Future<String?> getToken() => _storage.read(key: _keyToken);
  static Future<String?> getRole()  => _storage.read(key: _keyRole);

  static Future<void> clear() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRole);
  }
}
