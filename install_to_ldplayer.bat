@echo off
echo Yapı Kredi Mobil LDPlayer'a kuruluyor...
C:\LDPlayer\LDPlayer9\ldconsole.exe runapp --index 0 --packagename com.android.chrome
timeout /t 3
C:\LDPlayer\LDPlayer9\adb.exe connect 127.0.0.1:5555
C:\LDPlayer\LDPlayer9\adb.exe -s 127.0.0.1:5555 shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:8000/app" com.android.chrome
echo Tamamlandı!
pause