import java.io.OutputStream;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.jar.JarFile;

/** Verify every payload entry and pin its actual signer, without trusting a self-signed CA. */
public class VerifyAndroidBundle {
    public static void main(String[] args) throws Exception {
        if (args.length != 2 || !args[1].matches("[a-f0-9]{64}"))
            throw new IllegalArgumentException("Expected bundle path and certificate SHA256");
        int signed = 0;
        try (var jar = new JarFile(Path.of(args[0]).toFile(), true)) {
            var entries = jar.entries();
            while (entries.hasMoreElements()) {
                var entry = entries.nextElement();
                if (entry.isDirectory()) continue;
                try (var stream = jar.getInputStream(entry)) {
                    stream.transferTo(OutputStream.nullOutputStream());
                }
                if (entry.getName().matches("META-INF/(?:MANIFEST\\.MF|[^/]+\\.(?:SF|RSA|DSA|EC))"))
                    continue;
                var signers = entry.getCodeSigners();
                if (signers == null || signers.length != 1)
                    throw new SecurityException("Missing or ambiguous signature: " + entry.getName());
                var certificate = signers[0].getSignerCertPath().getCertificates().get(0);
                var sha = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded()));
                if (!sha.equals(args[1])) throw new SecurityException("Unexpected signer: " + entry.getName());
                signed++;
            }
        }
        if (signed == 0) throw new SecurityException("No signed payload entries");
        System.out.println("Verified " + signed + " payload entries with the original upload certificate");
    }
}
