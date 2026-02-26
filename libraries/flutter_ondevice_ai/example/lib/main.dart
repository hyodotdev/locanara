import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'app_state.dart';
import 'screens/features_screen.dart';
import 'screens/framework_screen.dart';
import 'screens/device_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/feature_detail_screen.dart';
import 'screens/framework_detail_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: 'OnDevice AI',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFF2F2F7),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF333333),
            elevation: 0,
            scrolledUnderElevation: 0.5,
            systemOverlayStyle: SystemUiOverlayStyle.dark,
          ),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: Colors.white,
            indicatorColor: const Color(0xFF007AFF).withValues(alpha: 0.12),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF007AFF));
              }
              return const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF8E8E93));
            }),
          ),
        ),
        home: const MainScreen(),
        onGenerateRoute: (settings) {
          if (settings.name == '/feature-detail') {
            final args = settings.arguments as Map<String, String>;
            return MaterialPageRoute(
              builder: (_) => FeatureDetailScreen(id: args['id']!, name: args['name']!),
            );
          }
          if (settings.name == '/framework-detail') {
            final args = settings.arguments as Map<String, String>;
            return MaterialPageRoute(
              builder: (_) => FrameworkDetailScreen(id: args['id']!, name: args['name']!),
            );
          }
          return null;
        },
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  static const _screens = <Widget>[
    FeaturesScreen(),
    FrameworkScreen(),
    DeviceScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        height: 60,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined, color: Color(0xFF8E8E93)),
            selectedIcon: Icon(Icons.auto_awesome, color: Color(0xFF007AFF)),
            label: 'Features',
          ),
          NavigationDestination(
            icon: Icon(Icons.layers_outlined, color: Color(0xFF8E8E93)),
            selectedIcon: Icon(Icons.layers, color: Color(0xFF007AFF)),
            label: 'Framework',
          ),
          NavigationDestination(
            icon: Icon(Icons.phone_android_outlined, color: Color(0xFF8E8E93)),
            selectedIcon: Icon(Icons.phone_android, color: Color(0xFF007AFF)),
            label: 'Device',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined, color: Color(0xFF8E8E93)),
            selectedIcon: Icon(Icons.settings, color: Color(0xFF007AFF)),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
