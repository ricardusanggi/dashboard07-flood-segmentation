import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form       = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password   = TextEditingController();
  bool  _obscure    = true;
  bool  _loading    = false;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);

    final ok = await context.read<AuthProvider>().login(
          _identifier.text.trim(),
          _password.text,
        );

    if (!mounted) return;
    setState(() => _loading = false);

    if (ok) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      final err = context.read<AuthProvider>().error ?? 'Login gagal.';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(err), backgroundColor: kError));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),

                // Header
                Center(
                  child: Column(children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [kPrimary, kAccent],
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.water,
                          size: 48, color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                    const Text('FloodSeg AI',
                        style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: kPrimary)),
                    const SizedBox(height: 4),
                    Text('Masuk ke akun Anda',
                        style:
                            TextStyle(color: Colors.grey[600], fontSize: 14)),
                  ]),
                ),

                const SizedBox(height: 40),

                // Username / Email
                TextFormField(
                  controller: _identifier,
                  decoration: _inputDec(
                      'Username atau Email', Icons.person_outline),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Wajib diisi' : null,
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: _inputDec('Password', Icons.lock_outline).copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                          _obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Wajib diisi' : null,
                ),

                const SizedBox(height: 28),

                AppButton(
                  label: 'Masuk',
                  icon: Icons.login,
                  loading: _loading,
                  onPressed: _submit,
                ),

                const SizedBox(height: 20),

                Center(
                  child: TextButton(
                    onPressed: () =>
                        Navigator.pushNamed(context, '/register'),
                    child: const Text(
                      'Belum punya akun? Daftar sekarang',
                      style: TextStyle(color: kAccent),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDec(String label, IconData icon) => InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: kAccent),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: kPrimary, width: 2),
        ),
        filled: true,
        fillColor: kSurface,
      );

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }
}
