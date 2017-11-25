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

sub testMethod {
    my ( $self ) = @_;
    my $str = "a1A";
    for (my $i = 0; $i < length($str); $i++) {
        my $c = substr $str, $i, 1;
        my $is_upper = "A" <= $c && $c <= "Z";
        my $is_lower = "a" <= $c && $c <= "z";
        my $is_number = "0" <= $c && $c <= "9";
        print(($is_upper ? "upper" : $is_lower ? "lower" : $is_number ? "number" : "other") . "\n");
    }
}

package Program;
my $c = new TestClass();
$c->testMethod();