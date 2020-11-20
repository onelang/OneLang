using System.Threading.Tasks;

public class Promise {
    public static Task<T> resolve<T>(T value) {
        return Task.FromResult(value);
    }
}
