use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $str = "a1A";
    for (my $i = 0; $i < length($str); $i++) {
        my $c = (substr $str, $i, 1);
        my $is_upper = "A" le $c && $c le "Z";
        my $is_lower = "a" le $c && $c le "z";
        my $is_number = "0" le $c && $c le "9";
        print(($is_upper ? "upper" : $is_lower ? "lower" : $is_number ? "number" : "other") . "\n");
    }
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}