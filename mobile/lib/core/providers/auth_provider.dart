import 'package:flutter/material.dart';
import '../models/user.dart';
import '../api/auth_api.dart';
import '../storage/auth_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.unknown;
  User?      _user;
  String?    _error;

  AuthStatus get status => _status;
  User?      get user   => _user;
  String?    get error  => _error;
  bool       get isLoggedIn => _status == AuthStatus.authenticated;

  /// Dipanggil saat app pertama launch
  Future<void> tryAutoLogin() async {
    final token = await AuthStorage.getToken();
    if (token == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      _user   = await AuthApi.getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      await AuthStorage.clear();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String identifier, String password) async {
    _error = null;
    try {
      _user   = await AuthApi.login(identifier, password);
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on Exception catch (e) {
      _error  = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    _error = null;
    try {
      await AuthApi.register(
        username: username,
        email:    email,
        password: password,
        fullName: fullName,
      );
      return true;
    } on Exception catch (e) {
      _error = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await AuthStorage.clear();
    _user   = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> refreshMe() async {
    try {
      _user = await AuthApi.getMe();
      notifyListeners();
    } catch (_) {}
  }

  String _parseError(Exception e) {
    final msg = e.toString();
    if (msg.contains('401') || msg.contains('Unauthorized')) {
      return 'Username/password salah.';
    }
    if (msg.contains('400')) return 'Data tidak valid.';
    if (msg.contains('409')) return 'Username atau email sudah digunakan.';
    if (msg.contains('SocketException') || msg.contains('Connection')) {
      return 'Tidak dapat terhubung ke server.';
    }
    return 'Terjadi kesalahan. Coba lagi.';
  }
}
