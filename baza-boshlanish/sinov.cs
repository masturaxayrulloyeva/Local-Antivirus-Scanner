#region Name

/*
using System;
using System.IO;

namespace fayl
{
    class Program
    {
        static void Main(string[] args)
        {
            DriveInfo[] drives = DriveInfo.GetDrives();
            foreach(DriveInfo drive in drives)
            {
                if (drive.IsReady)
                {
                    Console.WriteLine($"\n--- Disk: {drive.Name} ---");

                    try
                    {
                        //diskning asosiy papkasidan qidiramiz
                        WalkDirectory(drive.RootDirectory.FullName);
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine($"Xatolik(Ruxsat yuq ekan): {ex.Message}");
                    }
                }
            }
        }
        static void WalkDirectory(string path)
        {
            try
            {
                // o'sha papka ichidagi barcha fayllarni olamiz 
                string[] files = Directory.GetFiles(path);
                foreach(string file in files)
                {
                    // Bu yerda fayl nomini, kengaytmalarini tekshiramiz
                    // Masalan: .exe, .bat, .vbs larni topish uchun
                    if(file.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) || file.EndsWith(".bat", StringComparison.OrdinalIgnoreCase))
                    {
                        FileInfo fi = new FileInfo(file);
                        Console.WriteLine($"[Topildi] Fayl: {file} | Hajmi: {fi.Length}bayt | Vaqti: {fi.CreationTime}");
                    }
                }
                // shu papka ichidagi ichki papkalarni olib ichiga kiramiz 
                string[] subDirs = Directory.GetDirectories(path);
                foreach (string subDir in subDirs)
                {
                   // o'zini o'zi chaqirdi
                   WalkDirectory(subDir); 
                }
            }
            catch(UnauthorizedAccessException)
            {
                //  tizim ruxsat bermadi chetladik
            }
            catch (Exception)
            {
                //Boshqa istisnolar uchun
            }
        }
    }
}  */
#endregion

#region Name 
/*
    Console.WriteLine(ob.Name);
            Console.WriteLine(ob.DriveType);
            Console.WriteLine(ob.VolumeLabel);
            Console.WriteLine(Math.Floor(ob.TotalSize/Math.Pow(1024,3)) + "GB");
            Console.WriteLine(Math.Floor(ob.AvailableFreeSpace/Math.Pow(1024,3)));
            Console.WriteLine(ob.TotalFreeSpace/Math.Pow(1024,3));
            Console.WriteLine(ob.DriveFormat);
            Console.WriteLine(ob.IsReady);
            Console.WriteLine(ob.RootDirectory);
            */
#endregion