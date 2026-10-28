import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/api/auth_api.dart';
import '../../widgets/app_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editing  = false;
  bool _loading  = false;

  late final TextEditingController _fullName;
  late final TextEditingController _email;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _fullName = TextEditingController(text: user?.fullName ?? '');
    _email    = TextEditingController(text: user?.email    ?? '');
  }

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await AuthApi.updateMe(
        fullName: _fullName.text.trim(),
        email:    _email.text.trim(),
      );
      await context.read<AuthProvider>().refreshMe();
      if (!mounted) return;
      setState(() { _editing = false; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Profil berhasil diperbarui'),
        backgroundColor: kSuccess,
      ));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Gagal memperbarui: $e'),
        backgroundColor: kError,
      ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Keluar'),
        content: const Text('Yakin ingin keluar dari akun?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Batal')),
          ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kError),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Keluar',
                  style: TextStyle(color: Colors.white))),
        ],
      ),
    );
    if (confirm == true && mounted) {
      await context.read<AuthProvider>().logout();
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        actions: [
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _editing = true),
            )
          else
            TextButton(
              onPressed: () => setState(() => _editing = false),
              child: const Text('Batal', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 8),

            // Avatar
            CircleAvatar(
              radius: 44,
              backgroundColor: kPrimary,
              child: Text(
                (user?.username ?? 'U').substring(0, 1).toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
            Text(user?.username ?? '-',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: kPrimary)),
            const SizedBox(height: 4),
            _StatusBadge(isAdmin: user?.isAdmin ?? false,
                isApproved: user?.isRegistered ?? false),

            const SizedBox(height: 24),

            // Info / edit form
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _editing
                        ? TextFormField(
                            controller: _fullName,
                            decoration: _dec('Nama Lengkap', Icons.badge_outlined),
                          )
                        : _row('Nama Lengkap', user?.fullName ?? '-',
                            Icons.badge_outlined),
                    const Divider(height: 24),
                    _editing
                        ? TextFormField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _dec('Email', Icons.email_outlined),
                          )
                        : _row('Email', user?.email ?? '-', Icons.email_outlined),
                    const Divider(height: 24),
                    _row('Username', user?.username ?? '-', Icons.person_outline),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            if (_editing) ...[
              AppButton(
                label: 'Simpan Perubahan',
                icon: Icons.save,
                loading: _loading,
                onPressed: _save,
              ),
              const SizedBox(height: 12),
            ],

            // Logout
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout, color: kError),
                label: const Text('Keluar',
                    style: TextStyle(color: kError, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: kError),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value, IconData icon) => Row(
        children: [
          Icon(icon, size: 20, color: kAccent),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      );

  InputDecoration _dec(String label, IconData icon) => InputDecoration(
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
}

class _StatusBadge extends StatelessWidget {
  final bool isAdmin;
  final bool isApproved;
  const _StatusBadge({required this.isAdmin, required this.isApproved});

  @override
  Widget build(BuildContext context) {
    if (isAdmin) {
      return _badge('Admin', Colors.purple);
    } else if (isApproved) {
      return _badge('Disetujui', kSuccess);
    } else {
      return _badge('Menunggu Persetujuan', kWarning);
    }
  }

  Widget _badge(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Text(text,
            style: TextStyle(
                color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      );
}
