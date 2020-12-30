package io.onelang.std.file;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;
import java.io.StringWriter;
import java.io.PrintWriter;

import io.onelang.std.core.console;

public class OneFile {
    private static String excToStr(Exception e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }

    public static String readText(String fileName) {
        try {
            return Files.readString(Path.of(fileName));
        } catch(Exception e) {
            console.error("[ERROR] readText (fn = " + fileName + "): " + OneFile.excToStr(e));
            return null;
        }
    }

    public static String providePath(String fileName) throws IOException {
        Files.createDirectories(Paths.get(fileName).getParent());
        return fileName;
    }

    public static void writeText(String fileName, String data) {
        try {
            Files.writeString(Path.of(OneFile.providePath(fileName)), data);
        } catch(Exception e) {
            console.error("[ERROR] writeText (fn = " + fileName + "): " + OneFile.excToStr(e));
        }
    }

    public static String[] listFiles(String directory, Boolean recursive) {
        try {
            var dirPath = Path.of(directory);
            var files = Files.walk(Paths.get(directory)).filter(Files::isRegularFile).map(x -> dirPath.relativize(x)).map(Path::toString).sorted().toArray(String[]::new);
            return files;
        } catch(Exception e) {
            console.error("[ERROR] listFiles (directory = " + directory + ", recursive = " + recursive + "): " + OneFile.excToStr(e));
            return null;
        }
    }

    public static void copy(String srcFn, String dstFn) {
        try {
            Files.copy(Path.of(srcFn), Path.of(OneFile.providePath(dstFn)), StandardCopyOption.REPLACE_EXISTING);
        } catch(Exception e) {
            console.error("[ERROR] copy (srcFn = " + srcFn + ", dstFn = " + dstFn + "): " + OneFile.excToStr(e));
        }
    }
}